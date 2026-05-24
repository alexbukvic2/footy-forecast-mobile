import { useMemo, useState } from 'react';
import { View, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react-native';
import { Text, Button } from '@/components/ui';
import { useLeagues, useLeagueDetails, useDeleteLeague } from '@/hooks/useLeagues';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ApiError } from '@/api/client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeagueMembership {
  id: string;
  name: string;
  code: string;
  members: number;
  /** 1-indexed league position. 0 = not yet available. */
  position: number;
  /** Positive = climbed, negative = dropped, 0 = held / unknown. */
  change: number;
  isAdmin: boolean;
}

// ─── Brand atoms ─────────────────────────────────────────────────────────────

function WarmTopGlow() {
  return (
    <LinearGradient
      colors={['rgba(216,107,61,0.18)', 'rgba(216,107,61,0)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420 }}
      pointerEvents="none"
    />
  );
}

function Wordmark() {
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="w-7 h-7 rounded-card bg-brand-500 items-center justify-center">
        <Text className="font-display font-bold text-ink-invert text-[11px]">FF</Text>
      </View>
      <View>
        <Text className="font-display font-bold text-sm tracking-tight">Footy Forecast</Text>
        <Text className="font-mono uppercase text-ink-dim tracking-widest text-[9px]">
          {"World Cup '26 · beta"}
        </Text>
      </View>
    </View>
  );
}

// ─── Row pieces ──────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th');
}

function AdminTag() {
  return (
    <View className="h-5 px-1.5 rounded bg-brand-soft border border-brand-500/30 items-center justify-center">
      <Text className="font-mono uppercase text-brand-500 text-[9px] tracking-[0.18em]">
        admin
      </Text>
    </View>
  );
}

function TrendChip({ change }: { change: number }) {
  if (change > 0) {
    return (
      <View className="flex-row items-center gap-1">
        <ChevronUp size={12} color="#7FB069" strokeWidth={3} />
        <Text className="font-mono text-success text-[11px]">{change}</Text>
      </View>
    );
  }
  if (change < 0) {
    return (
      <View className="flex-row items-center gap-1">
        <ChevronDown size={12} color="#D84A4A" strokeWidth={3} />
        <Text className="font-mono text-danger text-[11px]">{Math.abs(change)}</Text>
      </View>
    );
  }
  return (
    <View
      accessibilityLabel="position unchanged"
      style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#5E9CD8' }}
    />
  );
}

function LeagueRow({
  league,
  onDeletePress,
}: {
  league: LeagueMembership;
  onDeletePress: (l: LeagueMembership) => void;
}) {
  return (
    <View className="rounded-card border border-line bg-surface/40 px-4 py-3.5 flex-row items-center gap-3">
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text variant="heading" numberOfLines={1} className="flex-shrink">
            {league.name}
          </Text>
          {league.isAdmin && <AdminTag />}
        </View>
        <View className="mt-1 flex-row items-center gap-2.5">
          {league.position > 0 ? (
            <Text className="font-mono text-ink-muted text-[11px] tracking-[0.12em]">
              {ordinal(league.position)}
              <Text className="text-ink-dim">{` of ${league.members}`}</Text>
            </Text>
          ) : (
            <Text className="font-mono text-ink-dim text-[11px]">
              {`${league.members} member${league.members !== 1 ? 's' : ''}`}
            </Text>
          )}
          <Text className="text-ink-dim text-[11px]">·</Text>
          <TrendChip change={league.change} />
        </View>
      </View>

      {league.isAdmin && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${league.name}`}
          onPress={() => onDeletePress(league)}
          hitSlop={8}
          className="w-9 h-9 rounded-pill border border-line items-center justify-center"
        >
          <Trash2 size={15} color="rgba(245,232,210,0.55)" />
        </Pressable>
      )}
    </View>
  );
}

// ─── Delete confirm sheet ─────────────────────────────────────────────────────

function DeleteConfirmSheet({
  league,
  busy,
  onConfirm,
  onCancel,
  error,
}: {
  league: LeagueMembership | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  error: string | null;
}) {
  return (
    <Modal
      transparent
      visible={league !== null}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        onPress={onCancel}
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      >
        <Pressable onPress={() => {}} className="mx-3 mb-3 rounded-card bg-surface-raised border border-line-strong overflow-hidden">
          <View className="px-5 pt-5 pb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-1.5 h-1.5 rounded-full bg-danger" />
              <Text variant="eyebrow" tone="danger" className="tracking-widest">
                DELETE LEAGUE · CONFIRM
              </Text>
            </View>
            <Text variant="display" className="mt-2 leading-tight tracking-tight" style={{ fontSize: 24 }}>
              {league ? `Disband ${league.name}?` : ''}
            </Text>
            <Text variant="body" tone="muted" className="mt-2 text-[13.5px] leading-relaxed">
              {league
                ? `This wipes the league for all ${league.members} members and erases every prediction. Can't be undone.`
                : ''}
            </Text>
            {error !== null && (
              <Text className="mt-3 text-[12.5px] text-danger">{error}</Text>
            )}
          </View>
          <View className="px-3 pb-3 pt-1 gap-2">
            <Button
              label={busy ? 'Deleting…' : 'Delete league'}
              variant="danger"
              size="md"
              fullWidth
              loading={busy}
              onPress={onConfirm}
            />
            <Button label="Cancel" variant="ghost" size="md" fullWidth onPress={onCancel} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View
        className="w-full rounded-card items-center justify-center py-10 px-5"
        style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(245,232,210,0.16)' }}
      >
        <Text variant="body" tone="dim" align="center" className="leading-relaxed">
          {"Nothing here. Start one, or jump into a friend's pool."}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LeaguesScreen() {
  const [pending, setPending] = useState<LeagueMembership | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: leagues, isPending: leaguesPending } = useLeagues();
  const { data: currentUser, isPending: userPending } = useCurrentUser();
  const leagueIds = useMemo(() => leagues?.map((l) => l.id) ?? [], [leagues]);
  const detailQueries = useLeagueDetails(leagueIds);

  const { mutate: deleteLeague, isPending: deleting } = useDeleteLeague();

  const isLoading = leaguesPending || userPending;

  const memberships: LeagueMembership[] = useMemo(() => {
    if (!leagues || !currentUser) return [];
    return leagues.map((league, i) => {
      const detail = detailQueries[i]?.data;
      return {
        id: league.id,
        name: league.name,
        code: league.code,
        members: detail?.members.length ?? 0,
        position: 0, // placeholder — update when leaderboard EP is available
        change: 0,   // placeholder — update when leaderboard EP is available
        isAdmin: league.owner_id === currentUser.id,
      };
    });
  }, [leagues, currentUser, detailQueries]);

  function handleDeletePress(league: LeagueMembership) {
    setDeleteError(null);
    setPending(league);
  }

  function handleConfirmDelete() {
    if (!pending) return;
    deleteLeague(pending.id, {
      onSuccess: () => setPending(null),
      onError: (err) => {
        const message =
          err instanceof ApiError && err.status === 403
            ? 'Only the league owner can delete it.'
            : 'Failed to delete league. Please try again.';
        setDeleteError(message);
      },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      {/* Header */}
      <View className="px-5 pt-3 flex-row items-center justify-between">
        <Wordmark />
        {!isLoading && (
          <Text className="font-mono uppercase text-ink-dim text-[9px] tracking-widest">
            {`${memberships.length} active`}
          </Text>
        )}
      </View>

      {/* Eyebrow */}
      <View className="px-6 pt-9">
        <Text variant="eyebrow">MY LEAGUES</Text>
      </View>

      {/* List */}
      {isLoading ? null : memberships.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          className="flex-1 px-5 pt-7"
          contentContainerClassName="gap-2.5 pb-3"
          showsVerticalScrollIndicator={false}
        >
          {memberships.map((l) => (
            <LeagueRow key={l.id} league={l} onDeletePress={handleDeletePress} />
          ))}
        </ScrollView>
      )}

      {/* CTAs */}
      <View className="px-5 pb-6 gap-3">
        <Button
          label="Create new league"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push('/(leagues)/create')}
        />
        <Button
          label="Join with code"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.push('/(leagues)/join')}
        />
      </View>

      <DeleteConfirmSheet
        league={pending}
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setPending(null); setDeleteError(null); }}
        error={deleteError}
      />
    </SafeAreaView>
  );
}
