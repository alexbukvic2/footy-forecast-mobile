/**
 * app/(tabs)/leagues.tsx — Leagues (roster)
 *
 * DESIGN REFERENCE, not drop-in code. Hand it to Claude Code as the visual
 * target while wiring up real membership reads, the destructive delete, and
 * navigation to Create / Join / League detail.
 *
 * The screen takes callbacks rather than importing router APIs — trivial
 * for tests and Storybook. Map them however your router prefers:
 *
 *     onOpen(league)  → router.push(`/leagues/${league.id}`)
 *     onCreate()      → router.push('/leagues/create')
 *     onJoin()        → router.push('/leagues/join')
 *     onDelete(l)     → supabase.from('leagues').delete().eq('id', l.id)
 *
 * Import depth assumes the route lives at `app/(tabs)/leagues.tsx`. Adjust
 * `../../components/ui` if you nest it deeper.
 */

import { useState } from 'react';
import { View, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react-native';

import { Button, Text } from '../../components/ui';

// ────────────────────────────────────────────────────────────────────
// Brand atoms — same as sign-in. Promote to components/brand/* once
// we have a third screen importing them.
// ────────────────────────────────────────────────────────────────────

function Wordmark() {
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="w-[26px] h-[26px] rounded-card bg-brand-500 items-center justify-center">
        <Text className="font-display font-bold text-ink-invert text-[11px]">FF</Text>
      </View>
      <View>
        <Text className="font-display font-bold tracking-tight text-[11px]">Footy Forecast</Text>
        <Text className="font-mono uppercase text-ink-dim tracking-widest text-[9px]">
          World Cup '26 · beta
        </Text>
      </View>
    </View>
  );
}

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

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

export interface LeagueMembership {
  id: string;
  name: string;
  code: string;
  /** Number of members in the league. */
  members: number;
  /** User's current 1-indexed position on the league's table. */
  position: number;
  /**
   * Position delta since the last table update. Positive = climbed,
   * negative = dropped, 0 = held.
   */
  change: number;
  /** True when the current user is the league commissioner. */
  isAdmin: boolean;
}

export interface LeaguesListProps {
  leagues: LeagueMembership[];
  onOpen: (league: LeagueMembership) => void;
  onCreate: () => void;
  onJoin: () => void;
  /**
   * Caller performs the destructive write; the screen owns the confirm UI.
   * Resolve to dismiss the modal, reject to surface an inline error.
   */
  onDelete: (league: LeagueMembership) => Promise<void> | void;
}

// ────────────────────────────────────────────────────────────────────
// Row pieces
// ────────────────────────────────────────────────────────────────────

/** 1 → 1st, 2 → 2nd, 3 → 3rd, 11 → 11th, 21 → 21st … */
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
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

/**
 * Position-delta indicator. The semantic color carries the meaning so the
 * metric line is scannable at a glance:
 *   change > 0 → success (climbed)
 *   change < 0 → danger  (dropped)
 *   change = 0 → a small blue dot (held)
 *
 * Blue is the only “cool” note in an otherwise warm palette; it stands out
 * as the neutral state without competing with the up/down semantics.
 */
function TrendChip({ change }: { change: number }) {
  if (change > 0) {
    return (
      <View className="flex-row items-center gap-1">
        <ChevronUp size={12} color="#7FB069" strokeWidth={3} />
        <Text className="font-mono text-success text-[11px] tabular-nums">{change}</Text>
      </View>
    );
  }
  if (change < 0) {
    return (
      <View className="flex-row items-center gap-1">
        <ChevronDown size={12} color="#D84A4A" strokeWidth={3} />
        <Text className="font-mono text-danger text-[11px] tabular-nums">{Math.abs(change)}</Text>
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
  onOpen,
  onDeletePress,
}: {
  league: LeagueMembership;
  onOpen: (l: LeagueMembership) => void;
  onDeletePress: (l: LeagueMembership) => void;
}) {
  return (
    <View className="rounded-card border border-line bg-surface/40 px-4 py-3.5 flex-row items-center gap-3">
      <Pressable
        onPress={() => onOpen(league)}
        className="flex-1 active:opacity-80"
      >
        <View className="flex-row items-center gap-2">
          <Text variant="heading" className="text-[17px] leading-tight" numberOfLines={1}>
            {league.name}
          </Text>
          {league.isAdmin ? <AdminTag /> : null}
        </View>
        <View className="mt-1 flex-row items-center gap-2.5">
          <Text className="font-mono uppercase text-ink-muted text-[11px] tracking-[0.12em] tabular-nums">
            {ordinal(league.position)}
            <Text className="text-ink-dim">{` of ${league.members}`}</Text>
          </Text>
          <Text className="text-ink-dim text-[11px]">·</Text>
          <TrendChip change={league.change} />
        </View>
      </Pressable>

      {league.isAdmin ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${league.name}`}
          onPress={() => onDeletePress(league)}
          hitSlop={8}
          className="w-9 h-9 rounded-pill border border-line items-center justify-center"
        >
          <Trash2 size={15} color="rgba(245,232,210,0.55)" />
        </Pressable>
      ) : null}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────
// Delete confirm — bottom-sheet via native Modal
// ────────────────────────────────────────────────────────────────────

/**
 * The destructive button sits *above* a cancel (stacked, not side-by-side)
 * so the dangerous action never lives next to the safe one on a small touch
 * target. The league name lives in the title — the button stays generic so
 * the user reads the body, where the irreversible blast radius is spelled
 * out.
 */
export interface DeleteLeagueConfirmProps {
  league: LeagueMembership | null;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export function DeleteLeagueConfirm({
  league, onConfirm, onCancel, busy,
}: DeleteLeagueConfirmProps) {
  return (
    <Modal
      transparent
      visible={!!league}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        onPress={onCancel}
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      >
        {/* Stop press propagation so taps inside the sheet don't dismiss. */}
        <Pressable onPress={() => {}} className="mx-3 mb-3 rounded-card bg-surface-raised border border-line-strong overflow-hidden">
          <View className="px-5 pt-5 pb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-1.5 h-1.5 rounded-full bg-danger" />
              <Text variant="eyebrow" tone="danger" className="tracking-widest">
                DELETE LEAGUE · CONFIRM
              </Text>
            </View>
            <Text variant="display" className="mt-2 leading-[1.05] tracking-tight" style={{ fontSize: 24 }}>
              {league ? `Disband ${league.name}?` : ''}
            </Text>
            <Text variant="body" tone="muted" className="mt-2 text-[13.5px] leading-relaxed">
              {league
                ? `This wipes the league for all ${league.members} members and erases every prediction. Can't be undone.`
                : ''}
            </Text>
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

// ────────────────────────────────────────────────────────────────────
// Screen
// ────────────────────────────────────────────────────────────────────

export function LeaguesListScreen({
  leagues, onOpen, onCreate, onJoin, onDelete,
}: LeaguesListProps) {
  const [pending, setPending] = useState<LeagueMembership | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    if (!pending) return;
    setBusy(true);
    try {
      await onDelete(pending);
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      {/* Top bar */}
      <View className="px-5 pt-3 flex-row items-center justify-between">
        <Wordmark />
        <Text className="font-mono uppercase text-ink-dim text-[9px] tracking-widest">
          {`${leagues.length} active`}
        </Text>
      </View>

      {/* Hero — eyebrow only. The list speaks for itself. */}
      <View className="px-6 pt-9">
        <Text variant="eyebrow">MY LEAGUES</Text>
      </View>

      {/* Roster */}
      <View className="flex-1 px-5 pt-7 pb-3 gap-2.5">
        {leagues.map((l) => (
          <LeagueRow
            key={l.id}
            league={l}
            onOpen={onOpen}
            onDeletePress={(target) => setPending(target)}
          />
        ))}
      </View>

      {/* CTAs */}
      <View className="px-5 pb-6 gap-3">
        <Button label="Create new league" variant="primary"   size="lg" fullWidth onPress={onCreate} />
        <Button label="Join with code"    variant="secondary" size="lg" fullWidth onPress={onJoin}   />
      </View>

      <DeleteLeagueConfirm
        league={pending}
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />
    </SafeAreaView>
  );
}
