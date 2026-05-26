import { ApiError } from '@/api/client';
import type { BulkPlayerPredictionItem, BulkTeamPredictionItem, Player, TeamWithHandicaps } from '@/api/outrights';
import { SearchableSelect, type SelectItem } from '@/components/SearchableSelect';
import { Text } from '@/components/ui';
import {
    useBulkUpsertPlayerPredictions,
    useBulkUpsertTeamPredictions,
    useHandicapPlayers,
    useOutrightsComplete,
    usePlayerPredictions,
    useSearchPlayers,
    useTeamPredictions,
    useTeams,
} from '@/hooks/useOutrights';
import type { components } from '@/types/api';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

type TeamHCat = components['schemas']['TeamHandicapCategory'];

// ─── Group table ──────────────────────────────────────────────────────────────

interface GroupTableProps {
  teams: TeamWithHandicaps[];
  winnerTeamId: string | null;
  koTeamIds: string[];
  koCountInGroup: number;
  totalKoPicks: number;
  locked: boolean;
  onWinner: (teamId: string) => void;
  onKo: (teamId: string) => void;
}

function GroupTable({
  teams,
  winnerTeamId,
  koTeamIds,
  koCountInGroup,
  totalKoPicks,
  locked,
  onWinner,
  onKo,
}: GroupTableProps) {
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(245,232,210,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Column headers */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(245,232,210,0.08)',
          backgroundColor: 'rgba(245,232,210,0.04)',
        }}
      >
        <View style={{ flex: 1 }} />
        <View style={{ width: 68, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: undefined,
              fontSize: 10,
              letterSpacing: 1.4,
              color: 'rgba(245,232,210,0.4)',
              textTransform: 'uppercase',
            }}
          >
            KO
          </Text>
        </View>
        <View style={{ width: 52, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: undefined,
              fontSize: 10,
              letterSpacing: 1.4,
              color: 'rgba(245,232,210,0.4)',
              textTransform: 'uppercase',
            }}
          >
            W
          </Text>
        </View>
      </View>

      {/* Team rows */}
      {teams.map((team, index) => {
        const isKoSelected = koTeamIds.includes(team.id);
        const isWSelected = team.id === winnerTeamId;
        const koDisabled = locked || (!isKoSelected && (koCountInGroup >= 2 || totalKoPicks >= 20));
        const koPoints = team.handicaps.find((h) => h.category === 'playoff')?.points;
        const wPoints = team.handicaps.find((h) => h.category === 'group_winner')?.points;

        return (
          <View
            key={team.id}
            style={[
              { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11 },
              index > 0 ? { borderTopWidth: 1, borderTopColor: 'rgba(245,232,210,0.05)' } : {},
            ]}
          >
            {/* Team name */}
            <Text
              numberOfLines={1}
              style={{ flex: 1, fontSize: 13, color: 'rgba(245,232,210,0.85)', paddingRight: 8 }}
            >
              {team.name}
            </Text>

            {/* KO checkbox */}
            <Pressable
              onPress={() => onKo(team.id)}
              disabled={locked || koDisabled}
              style={{ width: 68, alignItems: 'center' }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isKoSelected, disabled: koDisabled }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {koPoints !== undefined && (
                  <Text
                    style={{
                      fontSize: 10,
                      color: isKoSelected
                        ? '#D86B3D'
                        : koDisabled
                          ? 'rgba(245,232,210,0.12)'
                          : 'rgba(245,232,210,0.35)',
                    }}
                  >
                    {koPoints}
                  </Text>
                )}
                <View
                  style={[
                    {
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    isKoSelected
                      ? { backgroundColor: '#D86B3D', borderColor: '#D86B3D' }
                      : koDisabled
                        ? { borderColor: 'rgba(245,232,210,0.12)' }
                        : { borderColor: 'rgba(245,232,210,0.3)' },
                  ]}
                >
                  {isKoSelected && (
                    <Text style={{ color: '#0E0B09', fontSize: 11, fontWeight: '700' }}>✓</Text>
                  )}
                </View>
              </View>
            </Pressable>

            {/* W radio */}
            <Pressable
              onPress={() => onWinner(team.id)}
              disabled={locked}
              style={{ width: 52, alignItems: 'center' }}
              accessibilityRole="radio"
              accessibilityState={{ checked: isWSelected }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {wPoints !== undefined && (
                  <Text
                    style={{
                      fontSize: 10,
                      color: isWSelected ? '#D86B3D' : 'rgba(245,232,210,0.35)',
                    }}
                  >
                    {wPoints}
                  </Text>
                )}
                <View
                  style={[
                    {
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    isWSelected
                      ? { borderColor: '#D86B3D' }
                      : { borderColor: 'rgba(245,232,210,0.3)' },
                  ]}
                >
                  {isWSelected && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#D86B3D',
                      }}
                    />
                  )}
                </View>
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

// ─── Player search dropdown ───────────────────────────────────────────────────

interface PlayerSearchSelectProps {
  category: 'group_top_scorer' | 'total_top_scorer';
  value: SelectItem | null;
  onChange: (item: SelectItem | null) => void;
  placeholder?: string;
  disabled?: boolean;
  group?: string;
  preloadedPlayers?: Player[];
}

function PlayerSearchSelect({
  category,
  value,
  onChange,
  placeholder = 'Search player…',
  disabled = false,
  group,
  preloadedPlayers = [],
}: PlayerSearchSelectProps) {
  const [searchText, setSearchText] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleQueryChange = useCallback((text: string) => {
    setSearchText(text);
    clearTimeout(timerRef.current);
    if (text.length >= 2) {
      timerRef.current = setTimeout(() => setDebouncedQ(text), 350);
    } else {
      setDebouncedQ('');
    }
  }, []);

  const { data: searchedPlayers, isFetching } = useSearchPlayers(debouncedQ, group);

  const items = useMemo<SelectItem[]>(() => {
    const lower = searchText.toLowerCase();

    // Pre-loaded players filtered client-side by current search text
    const matchedPreloaded = searchText.length > 0
      ? preloadedPlayers.filter(
          (p) => p.name.toLowerCase().includes(lower) || p.team_name.toLowerCase().includes(lower),
        )
      : preloadedPlayers;

    // API search results not already covered by preloaded
    const preloadedIds = new Set(preloadedPlayers.map((p) => p.id));
    const extra = (searchedPlayers ?? []).filter((p) => !preloadedIds.has(p.id));

    // Combine and convert to SelectItem
    const combined: SelectItem[] = [...matchedPreloaded, ...extra].map((p) => ({
      id: p.id,
      label: p.name,
      subtitle: p.team_name,
      points: p.handicaps[category] as number | undefined,
    }));

    // Sort by handicap points ASC; players without points go last
    combined.sort((a, b) => {
      if (a.points === undefined && b.points === undefined) return 0;
      if (a.points === undefined) return 1;
      if (b.points === undefined) return -1;
      return a.points - b.points;
    });

    return combined;
  }, [searchText, preloadedPlayers, searchedPlayers, category]);

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      items={items}
      query={searchText}
      onQueryChange={handleQueryChange}
      isLoading={isFetching}
      minSearchLength={0}
      disabled={disabled}
    />
  );
}

// ─── Team dropdown ────────────────────────────────────────────────────────────

interface TeamSelectProps {
  teams: TeamWithHandicaps[];
  category: TeamHCat;
  value: SelectItem | null;
  onChange: (item: SelectItem | null) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: string[];
}

function TeamSelect({ teams, category, value, onChange, placeholder, disabled, excludeIds }: TeamSelectProps) {
  const [query, setQuery] = useState('');

  const items = useMemo<SelectItem[]>(() => {
    const source = query
      ? teams.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
      : teams;
    return source
      .filter((t) => excludeIds === undefined || !excludeIds.includes(t.id))
      .map((t) => ({
        id: t.id,
        label: t.name,
        points: t.handicaps.find((h) => h.category === category)?.points,
      }));
  }, [teams, query, category, excludeIds]);

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? 'Select team…'}
      items={items}
      query={query}
      onQueryChange={setQuery}
      disabled={disabled}
    />
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 12,
        gap: 12,
      }}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(245,232,210,0.08)' }} />
      <Text
        style={{
          fontSize: 10.5,
          letterSpacing: 1.6,
          color: 'rgba(245,232,210,0.45)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(245,232,210,0.08)' }} />
    </View>
  );
}

// ─── Outrights tab ────────────────────────────────────────────────────────────

interface OutrightsTabProps {
  bottomPadding: number;
}

export function OutrightsTab({ bottomPadding }: OutrightsTabProps) {
  const { data: teams, isPending: teamsPending, isError: teamsError } = useTeams();
  const { data: teamPredsResponse, isPending: teamPredsPending, isError: teamPredsError } =
    useTeamPredictions();
  const { data: playerPredsResponse, isPending: playerPredsPending, isError: playerPredsError } =
    usePlayerPredictions();
  const { data: handicapPlayers, isPending: handicapPlayersPending } = useHandicapPlayers();
  const { mutate: upsertTeams } = useBulkUpsertTeamPredictions();
  const { mutate: upsertPlayers } = useBulkUpsertPlayerPredictions();
  const [saveError, setSaveError] = useState<string | null>(null);

  const teamPreds = teamPredsResponse?.predictions ?? [];
  const playerPreds = playerPredsResponse?.predictions ?? [];
  const locked = (teamPredsResponse?.locked ?? false) || (playerPredsResponse?.locked ?? false);

  // ── Derived data ────────────────────────────────────────────────────────────

  const { teamsByGroup, groups } = useMemo(() => {
    const map: Record<string, TeamWithHandicaps[]> = {};
    for (const team of teams ?? []) {
      const g = team.group_letter;
      if (g) {
        const arr = map[g] ?? [];
        arr.push(team);
        map[g] = arr;
      }
    }
    return { teamsByGroup: map, groups: Object.keys(map).sort() };
  }, [teams]);

  const allTeams = teams ?? [];

  const totalKoPicks = useMemo(
    () =>
      teamPreds.filter((p) => p.category === 'playoff' && p.team_id != null).length,
    [teamPreds],
  );

  const getGroupTeamPreds = useCallback(
    (group: string, category: 'group_winner' | 'playoff') =>
      teamPreds.filter((p) => p.category === category && p.group === group),
    [teamPreds],
  );

  const getPlayerPred = useCallback(
    (
      category: 'group_top_scorer' | 'total_top_scorer',
      group?: string,
    ): SelectItem | null => {
      const p = playerPreds.find(
        (x) => x.category === category && (group === undefined || x.group === group),
      );
      if (!p?.player_id) return null;
      return { id: p.player_id, label: p.player_name ?? '' };
    },
    [playerPreds],
  );

  const semifinalistPreds = useMemo(
    () => teamPreds.filter((p) => p.category === 'semifinalist'),
    [teamPreds],
  );

  const winnerPredEntry = useMemo(
    () => teamPreds.find((p) => p.category === 'winner') ?? null,
    [teamPreds],
  );

  const isComplete = useOutrightsComplete();

  // ── Error handler ───────────────────────────────────────────────────────────

  const handleSaveError = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 403) {
      setSaveError('Locked — or KO wildcard cap reached (max 20)');
    } else {
      setSaveError('Failed to save. Please try again.');
    }
  }, []);

  // ── Team prediction handlers ────────────────────────────────────────────────

  const handleGroupWinner = useCallback(
    (group: string, teamId: string) => {
      setSaveError(null);
      const current = getGroupTeamPreds(group, 'group_winner')[0];
      const isToggleOff = current?.team_id === teamId;
      const items: BulkTeamPredictionItem[] = [
        {
          category: 'group_winner',
          group_letter: group,
          slot_index: 0,
          team_id: isToggleOff ? null : teamId,
        },
      ];
      if (!isToggleOff) {
        // If this team is currently a KO pick, clear it
        const koPreds = getGroupTeamPreds(group, 'playoff');
        const koIdx = koPreds.findIndex((p) => p.team_id === teamId);
        if (koIdx >= 0) {
          items.push({
            category: 'playoff',
            group_letter: group,
            slot_index: koIdx,
            team_id: null,
          });
        }
      }
      upsertTeams(items, { onError: handleSaveError });
    },
    [getGroupTeamPreds, upsertTeams, handleSaveError],
  );

  const handleGroupKo = useCallback(
    (group: string, teamId: string) => {
      setSaveError(null);
      const preds = getGroupTeamPreds(group, 'playoff');
      const existingIdx = preds.findIndex((p) => p.team_id === teamId);

      if (existingIdx >= 0) {
        // Toggle off
        upsertTeams(
          [{ category: 'playoff', group_letter: group, slot_index: existingIdx, team_id: null }],
          { onError: handleSaveError },
        );
      } else {
        const koCountInGroup = preds.filter((p) => p.team_id != null).length;
        if (koCountInGroup >= 2 || totalKoPicks >= 20) return;
        const emptyIdx = preds.findIndex((p) => p.team_id == null);
        const slotIndex = emptyIdx >= 0 ? emptyIdx : preds.length;
        const items: BulkTeamPredictionItem[] = [
          { category: 'playoff', group_letter: group, slot_index: slotIndex, team_id: teamId },
        ];
        // If this team is currently the group winner, clear it
        const winnerPred = getGroupTeamPreds(group, 'group_winner')[0];
        if (winnerPred?.team_id === teamId) {
          items.push({
            category: 'group_winner',
            group_letter: group,
            slot_index: 0,
            team_id: null,
          });
        }
        upsertTeams(items, { onError: handleSaveError });
      }
    },
    [getGroupTeamPreds, upsertTeams, handleSaveError, totalKoPicks],
  );

  const handleSemifinalist = useCallback(
    (slotIndex: number, item: SelectItem | null) => {
      setSaveError(null);
      const pred: BulkTeamPredictionItem = {
        category: 'semifinalist',
        slot_index: slotIndex,
        team_id: item?.id ?? null,
      };
      upsertTeams([pred], { onError: handleSaveError });
    },
    [upsertTeams, handleSaveError],
  );

  const handleWinner = useCallback(
    (item: SelectItem | null) => {
      setSaveError(null);
      const pred: BulkTeamPredictionItem = {
        category: 'winner',
        slot_index: 0,
        team_id: item?.id ?? null,
      };
      upsertTeams([pred], { onError: handleSaveError });
    },
    [upsertTeams, handleSaveError],
  );

  // ── Player prediction handlers ──────────────────────────────────────────────

  const handleGroupTopScorer = useCallback(
    (group: string, item: SelectItem | null) => {
      setSaveError(null);
      const pred: BulkPlayerPredictionItem = {
        category: 'group_top_scorer',
        group_letter: group,
        player_id: item?.id ?? null,
      };
      upsertPlayers([pred], { onError: handleSaveError });
    },
    [upsertPlayers, handleSaveError],
  );

  const handleTotalTopScorer = useCallback(
    (item: SelectItem | null) => {
      setSaveError(null);
      const pred: BulkPlayerPredictionItem = {
        category: 'total_top_scorer',
        player_id: item?.id ?? null,
      };
      upsertPlayers([pred], { onError: handleSaveError });
    },
    [upsertPlayers, handleSaveError],
  );

  // ── Render guards ───────────────────────────────────────────────────────────

  if (teamsPending || teamPredsPending || playerPredsPending || handicapPlayersPending) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="rgba(216,107,61,0.8)" />
      </View>
    );
  }

  if (teamsError || teamPredsError || playerPredsError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text variant="body" tone="muted" align="center">
          Could not load predictions. Pull to retry.
        </Text>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1 }}>
      {/* KO wildcard counter — fixed above scroll */}
      <View
        style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}
      >
        {/* Complete / Incomplete badge */}
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            borderWidth: 1,
            backgroundColor: isComplete ? 'rgba(80,180,100,0.1)' : 'rgba(216,74,74,0.1)',
            borderColor: isComplete ? 'rgba(80,180,100,0.3)' : 'rgba(216,74,74,0.3)',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 0.5,
              color: isComplete ? '#5AB468' : '#D84A4A',
            }}
          >
            {isComplete ? 'Complete' : 'Incomplete'}
          </Text>
        </View>

        {/* KO picks counter */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 999,
            borderWidth: 1,
            backgroundColor:
              totalKoPicks >= 20 ? 'rgba(80,180,100,0.1)' : 'rgba(216,74,74,0.1)',
            borderColor:
              totalKoPicks >= 20 ? 'rgba(80,180,100,0.3)' : 'rgba(216,74,74,0.3)',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 0.5,
              color: totalKoPicks >= 20 ? '#5AB468' : '#D84A4A',
            }}
          >
            KO picks: {totalKoPicks}/20
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        style={{ flex: 1 }}
      >
        {/* Locked banner */}
        {locked && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: 'rgba(245,232,210,0.12)',
              backgroundColor: 'rgba(245,232,210,0.05)',
            }}
          >
            <Text style={{ fontSize: 15 }}>🔒</Text>
            <Text style={{ fontSize: 12, color: 'rgba(245,232,210,0.55)', flex: 1 }}>
              Predictions are locked — the tournament has kicked off.
            </Text>
          </View>
        )}

      {/* Save error banner */}
      {saveError !== null && (
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(216,74,74,0.25)',
            backgroundColor: 'rgba(216,74,74,0.1)',
          }}
        >
          <Text style={{ fontSize: 12, color: '#D84A4A' }}>{saveError}</Text>
        </View>
      )}

      {/* Groups A–L */}
      {groups.map((group) => {
        const groupTeams = teamsByGroup[group] ?? [];
        const winnerPredForGroup = getGroupTeamPreds(group, 'group_winner')[0];
        const koPreds = getGroupTeamPreds(group, 'playoff');
        const koTeamIds = koPreds
          .filter((p) => p.team_id != null)
          .map((p) => p.team_id!);
        const koCountInGroup = koTeamIds.length;
        const topScorerValue = getPlayerPred('group_top_scorer', group);

        return (
          <View key={group}>
            <SectionDivider label={`Group ${group}`} />

            <GroupTable
              teams={groupTeams}
              winnerTeamId={winnerPredForGroup?.team_id ?? null}
              koTeamIds={koTeamIds}
              koCountInGroup={koCountInGroup}
              totalKoPicks={totalKoPicks}
              locked={locked}
              onWinner={(teamId) => handleGroupWinner(group, teamId)}
              onKo={(teamId) => handleGroupKo(group, teamId)}
            />

            <View style={{ marginHorizontal: 20, marginBottom: 4 }}>
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: 1.4,
                  color: 'rgba(245,232,210,0.38)',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Group Top Scorer
              </Text>
              <PlayerSearchSelect
                category="group_top_scorer"
                value={topScorerValue}
                onChange={(item) => handleGroupTopScorer(group, item)}
                placeholder="Search player…"
                disabled={locked}
                group={group}
                preloadedPlayers={(handicapPlayers ?? []).filter((p) => p.group === group)}
              />
            </View>
          </View>
        );
      })}

      {/* Semifinalists */}
      <SectionDivider label="Semifinalists" />
      <View style={{ marginHorizontal: 20, gap: 8 }}>
        {([0, 1, 2, 3] as const).map((slotIndex) => {
          const pred = semifinalistPreds[slotIndex];
          const teamData = allTeams.find((t) => t.id === pred?.team_id);
          const currentValue: SelectItem | null = pred?.team_id
            ? {
                id: pred.team_id,
                label: pred.team_name ?? '',
                points: teamData?.handicaps.find((h) => h.category === 'semifinalist')?.points,
              }
            : null;
          const excludeIds = semifinalistPreds
            .filter((p, i) => i !== slotIndex && p.team_id != null)
            .map((p) => p.team_id!);
          return (
            <TeamSelect
              key={slotIndex}
              teams={allTeams}
              category="semifinalist"
              value={currentValue}
              onChange={(item) => handleSemifinalist(slotIndex, item)}
              placeholder={`Semifinalist ${slotIndex + 1}…`}
              disabled={locked}
              excludeIds={excludeIds}
            />
          );
        })}
      </View>

      {/* Tournament top scorer */}
      <SectionDivider label="Tournament Top Scorer" />
      <View style={{ marginHorizontal: 20 }}>
        <PlayerSearchSelect
          category="total_top_scorer"
          value={getPlayerPred('total_top_scorer')}
          onChange={handleTotalTopScorer}
          placeholder="Search player…"
          disabled={locked}
          preloadedPlayers={handicapPlayers ?? []}
        />
      </View>

      {/* World Cup Winner */}
      <SectionDivider label="World Cup Winner" />
      <View style={{ marginHorizontal: 20, marginBottom: 8 }}>
        {(() => {
          const teamData = allTeams.find((t) => t.id === winnerPredEntry?.team_id);
          const winnerValue: SelectItem | null = winnerPredEntry?.team_id
            ? {
                id: winnerPredEntry.team_id,
                label: winnerPredEntry.team_name ?? '',
                points: teamData?.handicaps.find((h) => h.category === 'winner')?.points,
              }
            : null;
          return (
            <TeamSelect
              teams={allTeams}
              category="winner"
              value={winnerValue}
              onChange={handleWinner}
              placeholder="Select winner…"
              disabled={locked}
            />
          );
        })()}
      </View>
      </ScrollView>
    </View>
  );
}
