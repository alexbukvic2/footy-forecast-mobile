import { ApiError } from '@/api/client';
import { Button, Text } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { LeaderboardEntry } from '@/hooks/useLeagues';
import { useDeleteLeague, useLeagueLeaderboard, useLeagues, useLeaveLeague } from '@/hooks/useLeagues';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronDown, Hash, LogOut, Plus, Share2, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeagueTab = 'leaderboard' | 'matches' | 'outrights';

interface ColumnDef {
  key: keyof LeaderboardEntry['points_breakdown'];
  label: string;
  legend: string;
}

interface LeagueItem {
  id: string;
  name: string;
  code: string;
  isAdmin: boolean;
  members: number;
}

// ─── Column config ────────────────────────────────────────────────────────────

const BREAKDOWN_COLUMNS: ColumnDef[] = [
  { key: 'score_pts',           label: 'M',  legend: 'match scores' },
  { key: 'group_top_scorer_pts',label: 'GS', legend: 'group top scorer' },
  { key: 'group_winner_pts',    label: 'GW', legend: 'group winner' },
  { key: 'playoff_pts',         label: 'KO', legend: 'through to playoff' },
  { key: 'semifinalist_pts',    label: 'SF', legend: 'semifinalists' },
  { key: 'total_top_scorer_pts',label: 'GB', legend: 'golden boot' },
  { key: 'winner_pts',          label: 'CH', legend: 'champion' },
];

// ─── Brand atoms ──────────────────────────────────────────────────────────────

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

// ─── Confirm sheet ────────────────────────────────────────────────────────────

function ConfirmSheet({
  visible,
  eyebrow,
  title,
  body,
  confirmLabel,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  eyebrow: string;
  title: string;
  body: string;
  confirmLabel: string;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        onPress={onCancel}
        className="flex-1 items-center justify-center px-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      >
        <Pressable onPress={() => {}} className="w-full rounded-card bg-surface-raised border border-line-strong overflow-hidden">
          <View className="px-5 pt-5 pb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-1.5 h-1.5 rounded-full bg-danger" />
              <Text variant="eyebrow" tone="danger" className="tracking-widest">
                {eyebrow}
              </Text>
            </View>
            <Text variant="display" className="mt-2 leading-tight tracking-tight" style={{ fontSize: 24 }}>
              {title}
            </Text>
            <Text variant="body" tone="muted" className="mt-2 text-[13.5px] leading-relaxed">
              {body}
            </Text>
            {error !== null && (
              <Text className="mt-3 text-[12.5px] text-danger">{error}</Text>
            )}
          </View>
          <View className="px-3 pb-3 pt-1 gap-2">
            <Button
              label={busy ? `${confirmLabel.split(' ')[0]}…` : confirmLabel}
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

// ─── League picker ────────────────────────────────────────────────────────────

interface LeaguePickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
  leagues: LeagueItem[];
  onDeleteRequest: (league: LeagueItem) => void;
  onLeaveRequest: (league: LeagueItem) => void;
}

function LeaguePicker({ selectedId, onSelect, leagues, onDeleteRequest, onLeaveRequest }: LeaguePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = leagues.find((l) => l.id === selectedId);

  const mutedIcon = 'rgba(245,232,210,0.55)';

  function handleShare(code: string, name: string) {
    void Share.share({ message: `Join my league "${name}" with code: ${code}` });
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Select league"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: 'rgba(245,232,210,0.12)',
          backgroundColor: 'rgba(245,232,210,0.06)',
          alignSelf: 'flex-start',
          maxWidth: '100%',
        }}
      >
        <Text
          numberOfLines={1}
          style={{ fontSize: 14, color: '#F5E8D2', fontWeight: '600', flexShrink: 1 }}
        >
          {selected?.name ?? 'Select league'}
        </Text>
        <ChevronDown size={14} color="rgba(245,232,210,0.55)" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#231B17',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              paddingTop: 12,
              paddingBottom: 32,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(245,232,210,0.15)',
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />
            <Text variant="eyebrow" style={{ marginHorizontal: 20, marginBottom: 12 }}>
              Your Leagues
            </Text>

            {/* League rows */}
            {leagues.map((l) => {
              const active = l.id === selectedId;
              return (
                <View
                  key={l.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: 20,
                    paddingRight: 8,
                    paddingVertical: 6,
                    backgroundColor: active ? 'rgba(216,107,61,0.10)' : 'transparent',
                  }}
                >
                  {/* Name — tap to select */}
                  <Pressable
                    onPress={() => { onSelect(l.id); setOpen(false); }}
                    style={{ flex: 1, paddingVertical: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${l.name}`}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 15,
                        color: active ? '#D86B3D' : '#F5E8D2',
                        fontWeight: active ? '600' : '400',
                      }}
                    >
                      {l.name}
                    </Text>
                  </Pressable>

                  {/* Share */}
                  <Pressable
                    onPress={() => handleShare(l.code, l.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`Share code for ${l.name}`}
                    hitSlop={8}
                    style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Share2 size={15} color={mutedIcon} strokeWidth={1.8} />
                  </Pressable>

                  {/* Delete (admin) or Leave (member) */}
                  {l.isAdmin ? (
                    <Pressable
                      onPress={() => { setOpen(false); onDeleteRequest(l); }}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${l.name}`}
                      hitSlop={8}
                      style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={15} color={mutedIcon} strokeWidth={1.8} />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => { setOpen(false); onLeaveRequest(l); }}
                      accessibilityRole="button"
                      accessibilityLabel={`Leave ${l.name}`}
                      hitSlop={8}
                      style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <LogOut size={15} color={mutedIcon} strokeWidth={1.8} />
                    </Pressable>
                  )}
                </View>
              );
            })}

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: 'rgba(245,232,210,0.07)',
                marginHorizontal: 20,
                marginTop: 8,
                marginBottom: 4,
              }}
            />

            {/* Join / Create */}
            <Pressable
              onPress={() => { setOpen(false); router.push('/(leagues)/join'); }}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: 12 }}
            >
              <Hash size={16} color={mutedIcon} strokeWidth={1.8} />
              <Text style={{ fontSize: 15, color: 'rgba(245,232,210,0.85)' }}>Join with code</Text>
            </Pressable>

            <Pressable
              onPress={() => { setOpen(false); router.push('/(leagues)/create'); }}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: 12 }}
            >
              <Plus size={16} color={mutedIcon} strokeWidth={1.8} />
              <Text style={{ fontSize: 15, color: 'rgba(245,232,210,0.85)' }}>Create new league</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── Segmented control ────────────────────────────────────────────────────────

function SegmentedControl({
  value,
  onChange,
}: {
  value: LeagueTab;
  onChange: (t: LeagueTab) => void;
}) {
  const tabs: { id: LeagueTab; label: string }[] = [
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'matches',     label: 'Matches' },
    { id: 'outrights',   label: 'Outrights' },
  ];

  return (
    <View className="mx-5 mt-4 flex-row rounded-pill bg-surface-raised border border-line p-1">
      {tabs.map(({ id, label }) => {
        const active = id === value;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className="flex-1 items-center justify-center py-2 rounded-pill"
            style={active ? { backgroundColor: 'rgba(216,107,61,0.18)' } : undefined}
          >
            <Text
              className="font-mono uppercase text-[11px] tracking-[0.16em]"
              style={{ color: active ? '#D86B3D' : 'rgba(245,232,210,0.55)' }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Leaderboard table ────────────────────────────────────────────────────────

function LeaderboardTable({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[];
  currentUserId: string | undefined;
}) {
  const { width: screenWidth } = useWindowDimensions();

  const visibleColumns = useMemo<ColumnDef[]>(() => {
    return BREAKDOWN_COLUMNS.filter((col) =>
      entries.some((e) => (e.points_breakdown[col.key] ?? 0) > 0),
    );
  }, [entries]);

  const legendItems = useMemo(() => {
    const shown = [...visibleColumns, { label: 'PTS', legend: 'total points' }];
    return shown;
  }, [visibleColumns]);

  const RANK_W = 20;
  const STAT_W = 22;
  const PTS_W = 34;
  const GRID_GAP = 4;
  const headerBg = 'rgba(245,232,210,0.05)';
  const divider = 'rgba(245,232,210,0.07)';

  const tableWidth = Math.max(280, screenWidth - 40);
  const columnCount = 3 + visibleColumns.length; // rank + player + dynamic + pts
  const horizontalPadding = 10;
  const reservedWidth =
    RANK_W +
    PTS_W +
    visibleColumns.length * STAT_W +
    (columnCount - 1) * GRID_GAP +
    horizontalPadding * 2;
  const NAME_W = Math.max(68, tableWidth - reservedWidth);

  return (
    <View style={{ flex: 1, marginHorizontal: 20 }}>
      <View style={{ width: tableWidth }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: headerBg,
            borderBottomWidth: 1,
            borderBottomColor: divider,
            paddingVertical: 8,
            paddingHorizontal: horizontalPadding,
            gap: GRID_GAP,
          }}
        >
          <View style={{ width: RANK_W, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 9, color: 'rgba(245,232,210,0.4)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              #
            </Text>
          </View>
          <View style={{ width: NAME_W }}>
            <Text style={{ fontSize: 9, color: 'rgba(245,232,210,0.4)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              PLAYER
            </Text>
          </View>
          {visibleColumns.map((col) => (
            <View key={col.key} style={{ width: STAT_W, alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: 'rgba(245,232,210,0.4)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                {col.label}
              </Text>
            </View>
          ))}
          <View style={{ width: PTS_W, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 9, color: '#D86B3D', fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.8 }}>
              PTS
            </Text>
          </View>
        </View>

        {/* Rows */}
        {entries.map((entry, idx) => {
          const isMe = entry.user_id === currentUserId;
          const isLast = idx === entries.length - 1;
          return (
            <View
              key={entry.user_id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: horizontalPadding,
                gap: GRID_GAP,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: divider,
                backgroundColor: isMe ? 'rgba(216,107,61,0.10)' : 'transparent',
                borderRadius: isMe ? 10 : 0,
              }}
            >
              <View style={{ width: RANK_W, alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: entry.position <= 3 ? '#D86B3D' : 'rgba(245,232,210,0.45)',
                    fontWeight: entry.position <= 3 ? '700' : '400',
                    fontFamily: 'monospace',
                  }}
                >
                  {entry.position}
                </Text>
              </View>

              <View style={{ width: NAME_W }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 13,
                    color: isMe ? '#F5E8D2' : 'rgba(245,232,210,0.9)',
                    fontWeight: isMe ? '600' : '400',
                  }}
                >
                  {entry.display_name}
                </Text>
              </View>

              {visibleColumns.map((col) => (
                <View key={col.key} style={{ width: STAT_W, alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: (entry.points_breakdown[col.key] ?? 0) > 0
                        ? 'rgba(245,232,210,0.85)'
                        : 'rgba(245,232,210,0.22)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {entry.points_breakdown[col.key] ?? 0}
                  </Text>
                </View>
              ))}

              <View style={{ width: PTS_W, alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: isMe ? '#DC7B4F' : '#D86B3D',
                    fontWeight: '700',
                    fontFamily: 'monospace',
                  }}
                >
                  {entry.total_points}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      {legendItems.length > 0 && (
        <View
          style={{
            marginTop: 16,
            marginBottom: 8,
            padding: 12,
            borderRadius: 12,
            backgroundColor: 'rgba(245,232,210,0.04)',
            borderWidth: 1,
            borderColor: 'rgba(245,232,210,0.07)',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {legendItems.map(({ label, legend }) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: label === 'PTS' ? '#D86B3D' : 'rgba(245,232,210,0.55)',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </Text>
              <Text style={{ fontSize: 10, color: 'rgba(245,232,210,0.35)' }}>
                {legend}
              </Text>
              <Text style={{ fontSize: 10, color: 'rgba(245,232,210,0.15)', marginLeft: 2 }}>
                ·
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Tab content ──────────────────────────────────────────────────────────────

function LeaderboardTab({ leagueId, currentUserId }: { leagueId: string; currentUserId: string | undefined }) {
  const { data, isPending, isError, refetch } = useLeagueLeaderboard(leagueId);

  if (isPending) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#D86B3D" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text tone="muted">Failed to load leaderboard.</Text>
        <Pressable onPress={() => void refetch()} style={{ padding: 8 }}>
          <Text tone="brand">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (data.leaderboard.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text tone="muted">No entries yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <LeaderboardTable
        entries={data.leaderboard}
        currentUserId={currentUserId}
      />
    </ScrollView>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text tone="muted">{label} — coming soon</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LeagueScreen() {
  const { data: leagues } = useLeagues();
  const { data: currentUser } = useCurrentUser();
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<LeagueTab>('leaderboard');

  const [pendingDelete, setPendingDelete] = useState<LeagueItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingLeave, setPendingLeave] = useState<LeagueItem | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const { mutate: deleteLeague, isPending: deleting } = useDeleteLeague();
  const { mutate: leaveLeague, isPending: leaving } = useLeaveLeague();

  const leagueList = useMemo<LeagueItem[]>(
    () =>
      (leagues ?? []).map((l) => ({
        id: l.id,
        name: l.name,
        code: l.code,
        isAdmin: l.owner_id === currentUser?.id,
        members: l.member_count,
      })),
    [leagues, currentUser],
  );

  // Auto-select first league when data loads
  const resolvedLeagueId = selectedLeagueId || (leagueList[0]?.id ?? '');

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    deleteLeague(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
      onError: (err) => {
        setDeleteError(
          err instanceof ApiError && err.status === 403
            ? 'Only the league owner can delete it.'
            : 'Failed to delete league. Please try again.',
        );
      },
    });
  }

  function handleConfirmLeave() {
    if (!pendingLeave || !currentUser) return;
    leaveLeague(
      { leagueId: pendingLeave.id, userId: currentUser.id },
      {
        onSuccess: () => setPendingLeave(null),
        onError: (err) => {
          setLeaveError(
            err instanceof ApiError && err.status === 403
              ? "You can't leave a league you own. Delete it instead."
              : 'Failed to leave league. Please try again.',
          );
        },
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <Text variant="eyebrow" style={{ marginBottom: 8 }}>League</Text>
        {leagueList.length > 0 ? (
          <LeaguePicker
            selectedId={resolvedLeagueId}
            onSelect={setSelectedLeagueId}
            leagues={leagueList}
            onDeleteRequest={(l) => { setDeleteError(null); setPendingDelete(l); }}
            onLeaveRequest={(l) => { setLeaveError(null); setPendingLeave(l); }}
          />
        ) : (
          <Text tone="muted" style={{ fontSize: 14 }}>No leagues</Text>
        )}
      </View>

      {/* Tabs */}
      <SegmentedControl value={activeTab} onChange={setActiveTab} />

      {/* Content */}
      <View style={{ flex: 1, marginTop: 16 }}>
        {activeTab === 'leaderboard' && resolvedLeagueId !== '' && (
          <LeaderboardTab leagueId={resolvedLeagueId} currentUserId={currentUser?.id} />
        )}
        {activeTab === 'matches' && <PlaceholderTab label="Matches" />}
        {activeTab === 'outrights' && <PlaceholderTab label="Outrights" />}
      </View>

      <ConfirmSheet
        visible={pendingDelete !== null}
        eyebrow="DELETE LEAGUE · CONFIRM"
        title={pendingDelete ? `Disband ${pendingDelete.name}?` : ''}
        body={pendingDelete ? `This wipes the league for all ${pendingDelete.members} members. Can't be undone.` : ''}
        confirmLabel="Delete league"
        busy={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setPendingDelete(null); setDeleteError(null); }}
      />

      <ConfirmSheet
        visible={pendingLeave !== null}
        eyebrow="LEAVE LEAGUE · CONFIRM"
        title={pendingLeave ? `Leave ${pendingLeave.name}?` : ''}
        body="Your predictions stay, but you'll be off the leaderboard. Rejoin anytime with the code."
        confirmLabel="Leave league"
        busy={leaving}
        error={leaveError}
        onConfirm={handleConfirmLeave}
        onCancel={() => { setPendingLeave(null); setLeaveError(null); }}
      />
    </SafeAreaView>
  );
}

