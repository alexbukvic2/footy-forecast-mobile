import { ApiError } from '@/api/client';
import { useSession } from '@/auth/session';
import { Button, Text } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDeleteLeague, useLeagues, useLeaveLeague } from '@/hooks/useLeagues';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronDown, ChevronUp, LogOut, Share2, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Brand atoms ──────────────────────────────────────────────────────────────

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

// ─── League row pieces ────────────────────────────────────────────────────────

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

function IconButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      className="w-9 h-9 rounded-pill border border-line items-center justify-center"
    >
      {children}
    </Pressable>
  );
}

function LeagueRow({
  league,
  onDeletePress,
  onLeavePress,
}: {
  league: LeagueMembership;
  onDeletePress: (l: LeagueMembership) => void;
  onLeavePress: (l: LeagueMembership) => void;
}) {
  function handleShare() {
    void Share.share({ message: league.code });
  }

  const mutedIcon = 'rgba(245,232,210,0.55)';

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
          <Text className="text-ink-dim text-[11px]">·</Text>
          <Text className="font-mono text-ink-dim text-[11px] tracking-[0.08em]">
            {league.code}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <IconButton label={`Share code for ${league.name}`} onPress={handleShare}>
          <Share2 size={15} color={mutedIcon} strokeWidth={1.8} />
        </IconButton>
        {league.isAdmin ? (
          <IconButton label={`Delete ${league.name}`} onPress={() => onDeletePress(league)}>
            <Trash2 size={15} color={mutedIcon} strokeWidth={1.8} />
          </IconButton>
        ) : (
          <IconButton label={`Leave ${league.name}`} onPress={() => onLeavePress(league)}>
            <LogOut size={15} color={mutedIcon} strokeWidth={1.8} />
          </IconButton>
        )}
      </View>
    </View>
  );
}

// ─── Confirm sheets ───────────────────────────────────────────────────────────

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarClearance = Math.max(insets.bottom, 12) + 64 + 12;

  // Profile state
  const { data: currentUser, isPending: userPending } = useCurrentUser();
  const { signOut } = useSession();
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (currentUser) setDisplayName(currentUser.display_name);
  }, [currentUser]);

  const isDirty = displayName.trim() !== (currentUser?.display_name ?? '');
  const isValid = displayName.trim().length >= 1;

  // Leagues state
  const [pendingDelete, setPendingDelete] = useState<LeagueMembership | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingLeave, setPendingLeave] = useState<LeagueMembership | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const { data: leagues, isPending: leaguesPending } = useLeagues();
  const { mutate: deleteLeague, isPending: deleting } = useDeleteLeague();
  const { mutate: leaveLeague, isPending: leaving } = useLeaveLeague();

  const memberships: LeagueMembership[] = useMemo(() => {
    if (!leagues || !currentUser) return [];
    return leagues.map((league) => ({
      id: league.id,
      name: league.name,
      code: league.code,
      members: league.member_count,
      position: 0, // placeholder — update when leaderboard EP is available
      change: 0,   // placeholder — update when leaderboard EP is available
      isAdmin: league.owner_id === currentUser.id,
    }));
  }, [leagues, currentUser]);

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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5 pt-3"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: tabBarClearance }}
        >
          {/* Profile section */}
          <View className="pt-9 pb-8">
            <Text variant="eyebrow">PROFILE</Text>
          </View>

          {/* Display name field */}
          <Text className="font-mono uppercase text-ink-dim text-[10px] tracking-[0.18em] mb-2">
            Display name
          </Text>
          <View
            className="rounded-card bg-surface-raised h-14 px-4 flex-row items-center"
            style={{
              borderWidth: 1,
              borderColor: displayName.length > 0 ? '#D86B3D' : 'rgba(245,232,210,0.08)',
            }}
          >
            <TextInput
              value={displayName}
              onChangeText={(v) => setDisplayName(v.slice(0, 64))}
              placeholder="Your name"
              placeholderTextColor="rgba(245,232,210,0.35)"
              returnKeyType="done"
              className="flex-1 text-ink text-[16px]"
              style={{ fontFamily: undefined }}
              editable={!userPending}
            />
            <Text className="font-mono text-[11px] text-ink-dim">
              {displayName.length}/64
            </Text>
          </View>

          {/* Email (read-only) */}
          {currentUser && (
            <Text className="mt-3 text-[12px] text-ink-dim">
              {currentUser.email}
            </Text>
          )}

          {/* Save — dummy until PATCH /users/me is available */}
          <View className="mt-6">
            <Button
              label="Save"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isDirty || !isValid}
              onPress={() => {
                // TODO: call PATCH /users/me when endpoint is available
              }}
            />
          </View>

          {/* My Leagues section */}
          <View className="mt-10 pb-2">
            <Text variant="eyebrow">MY LEAGUES</Text>
          </View>

          {/* League list */}
          {!leaguesPending && memberships.length === 0 ? (
            <View
              className="rounded-card items-center justify-center py-10 px-5 mt-7"
              style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(245,232,210,0.16)' }}
            >
              <Text variant="body" tone="dim" align="center" className="leading-relaxed">
                {"Nothing here. Start one, or jump into a friend's pool."}
              </Text>
            </View>
          ) : (
            <View className="gap-2.5 pt-7">
              {memberships.map((l) => (
                <LeagueRow
                  key={l.id}
                  league={l}
                  onDeletePress={(league) => { setDeleteError(null); setPendingDelete(league); }}
                  onLeavePress={(league) => { setLeaveError(null); setPendingLeave(league); }}
                />
              ))}
            </View>
          )}

          {/* League CTAs */}
          <View className="gap-3 mt-6">
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

          {/* Sign out */}
          <View className="mt-3">
            <Button
              label="Sign out"
              variant="ghost"
              size="lg"
              fullWidth
              onPress={() => void signOut()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
