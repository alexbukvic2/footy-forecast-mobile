import { ApiError } from '@/api/client';
import type { UserFixtureViewResponse } from '@/api/fixtures';
import { DialPicker } from '@/components/DialPicker';
import { OutrightsTab } from '@/components/OutrightsTab';
import { Text } from '@/components/ui';
import { useFixtures, useUpsertPrediction } from '@/hooks/useFixtures';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, SectionList, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'matches' | 'outrights';
type Scores = { home: number | null; away: number | null };

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupByDay(
  fixtures: UserFixtureViewResponse[],
): { title: string; data: UserFixtureViewResponse[] }[] {
  const map = new Map<string, UserFixtureViewResponse[]>();
  for (const f of fixtures) {
    const key = formatDateLabel(f.kickoff_at);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(f);
    } else {
      map.set(key, [f]);
    }
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

// ─── Brand atoms ─────────────────────────────────────────────────────────────

function WarmTopGlow() {
  return (
    <LinearGradient
      colors={['rgba(216,107,61,0.18)', 'rgba(216,107,61,0)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 380 }}
      pointerEvents="none"
    />
  );
}

// ─── Segmented control ────────────────────────────────────────────────────────

function SegmentedControl({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <View className="mx-5 mt-5 flex-row rounded-pill bg-surface-raised border border-line p-1">
      {(['matches', 'outrights'] as const).map((tab) => {
        const active = tab === value;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className="flex-1 items-center justify-center py-2 rounded-pill"
            style={active ? { backgroundColor: 'rgba(216,107,61,0.18)' } : undefined}
          >
            <Text
              className="font-mono uppercase text-[11px] tracking-[0.16em]"
              style={{ color: active ? '#D86B3D' : 'rgba(245,232,210,0.55)' }}
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Day section header ───────────────────────────────────────────────────────

function DayHeader({ title }: { title: string }) {
  return (
    <View className="px-5 pt-6 pb-2 flex-row items-center gap-3">
      <View className="flex-1 h-px bg-line" />
      <Text className="font-mono uppercase text-[10px] tracking-[0.2em] text-ink-dim">
        {title}
      </Text>
      <View className="flex-1 h-px bg-line" />
    </View>
  );
}

// ─── Fixture card ─────────────────────────────────────────────────────────────

interface FixtureCardProps {
  fixture: UserFixtureViewResponse;
  scores: Scores;
  saveError: string | null;
  onChangeHome: (v: number | null) => void;
  onChangeAway: (v: number | null) => void;
}

function FixtureCard({
  fixture,
  scores,
  saveError,
  onChangeHome,
  onChangeAway,
}: FixtureCardProps) {
  return (
    <View className="mx-5 mb-3 rounded-card border border-line bg-surface/40 overflow-hidden">
      <View className="px-4 pt-3 pb-2 flex-row items-center">
        <Text className="font-mono text-ink-muted text-[12px] tracking-[0.08em]">
          {formatTime(fixture.kickoff_at)}
        </Text>
        <Text className="text-ink-dim text-[11px] mx-2">·</Text>
        <Text className="text-ink-dim text-[11px]" numberOfLines={1}>
          {fixture.round}
        </Text>
      </View>

      {/* Score row: home name | dial | dial | away name */}
      <View className="px-4 pb-4 flex-row items-center">
        <View className="flex-1 items-end pr-2.5">
          <Text
            variant="heading"
            numberOfLines={2}
            className="text-right text-[12px] leading-snug"
          >
            {fixture.home_team_name}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          <DialPicker value={scores.home} onChange={onChangeHome} />
          <DialPicker value={scores.away} onChange={onChangeAway} />
        </View>

        <View className="flex-1 items-start pl-2.5">
          <Text
            variant="heading"
            numberOfLines={2}
            className="text-left text-[12px] leading-snug"
          >
            {fixture.away_team_name}
          </Text>
        </View>
      </View>

      {/* Save error */}
      {saveError !== null && (
        <View className="px-4 pb-3 -mt-1">
          <Text className="text-danger text-[11.5px]">{saveError}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Matches tab ──────────────────────────────────────────────────────────────

interface MatchesTabProps {
  bottomPadding: number;
}

function MatchesTab({ bottomPadding }: MatchesTabProps) {
  const { data: fixtures, isPending, isError } = useFixtures();
  const { mutate: upsertPrediction } = useUpsertPrediction();

  const [pending, setPending] = useState<Record<string, Scores>>({});
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const submitTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const sections = useMemo(
    () => groupByDay((fixtures ?? []).filter((f) => !f.prediction_locked)),
    [fixtures],
  );

  const getScores = useCallback(
    (fixture: UserFixtureViewResponse): Scores => {
      const p = pending[fixture.id];
      return {
        home: p?.home !== undefined ? p.home : (fixture.prediction?.goals_home ?? null),
        away: p?.away !== undefined ? p.away : (fixture.prediction?.goals_away ?? null),
      };
    },
    [pending],
  );

  const handleChange = useCallback(
    (fixture: UserFixtureViewResponse, side: 'home' | 'away', val: number | null) => {
      if (fixture.prediction_locked) return;

      setPending((prev) => {
        const curr = prev[fixture.id] ?? {
          home: fixture.prediction?.goals_home ?? null,
          away: fixture.prediction?.goals_away ?? null,
        };
        const updated: Scores = { ...curr, [side]: val };

        clearTimeout(submitTimers.current[fixture.id]);
        if (updated.home !== null && updated.away !== null) {
          submitTimers.current[fixture.id] = setTimeout(() => {
            upsertPrediction(
              { fixtureId: fixture.id, goalsHome: updated.home!, goalsAway: updated.away! },
              {
                onSuccess: () => {
                  setSaveErrors((e) => {
                    const next = { ...e };
                    delete next[fixture.id];
                    return next;
                  });
                },
                onError: (err) => {
                  setSaveErrors((e) => ({
                    ...e,
                    [fixture.id]:
                      err instanceof ApiError && err.status === 403
                        ? 'Locked. Too close to kick-off.'
                        : 'Failed to save, try again',
                  }));
                },
              },
            );
          }, 800);
        }

        return { ...prev, [fixture.id]: updated };
      });
    },
    [upsertPrediction],
  );

  if (isPending) return null;

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text variant="body" tone="muted" align="center">
          Could not load fixtures. Pull down to retry.
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center px-6 py-16">
          <View
            className="w-full rounded-card items-center justify-center py-10 px-5"
            style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(245,232,210,0.16)' }}
          >
            <Text variant="body" tone="dim" align="center" className="leading-relaxed">
              No upcoming fixtures.
            </Text>
          </View>
        </View>
      }
      renderSectionHeader={({ section }) => <DayHeader title={section.title} />}
      renderItem={({ item }) => {
        const scores = getScores(item);
        return (
          <FixtureCard
            fixture={item}
            scores={scores}
            saveError={saveErrors[item.id] ?? null}
            onChangeHome={(v) => handleChange(item, 'home', v)}
            onChangeAway={(v) => handleChange(item, 'away', v)}
          />
        );
      }}
    />
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PredictScreen() {
  const insets = useSafeAreaInsets();
  const tabBarClearance = Math.max(insets.bottom, 12) + 64 + 12;

  const [activeTab, setActiveTab] = useState<Tab>('matches');

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      <View className="px-6 pt-9">
        <Text variant="eyebrow">PREDICT</Text>
      </View>

      <SegmentedControl value={activeTab} onChange={setActiveTab} />

      {activeTab === 'matches' ? (
        <MatchesTab bottomPadding={tabBarClearance} />
      ) : (
        <OutrightsTab bottomPadding={tabBarClearance} />
      )}
    </SafeAreaView>
  );
}
