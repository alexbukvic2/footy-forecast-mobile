/**
 * app/(tabs)/leagues/[id]/leaderboard.tsx — League Leaderboard
 *
 * DESIGN REFERENCE, not drop-in code. Hand it to Claude Code as the visual
 * target while wiring up the real standings read, realtime updates, and
 * navigation to a player's prediction sheet.
 *
 * The screen takes data and a callback rather than importing router APIs —
 * trivial for tests and Storybook. Map however your router prefers:
 *
 *     onOpenPlayer(row) → router.push(`/leagues/${leagueId}/player/${row.id}`)
 *
 * Import depth assumes the route lives at
 * `app/(tabs)/leagues/[id]/leaderboard.tsx`. Adjust `../../../components/ui`
 * if you nest it differently.
 */

import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '../../../components/ui';

// ────────────────────────────────────────────────────────────────────
// Brand atoms — same as sign-in / leagues. Promote to components/brand/*
// once a third screen imports them.
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
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 380 }}
      pointerEvents="none"
    />
  );
}

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

/**
 * One row in the league standings.
 *
 * `prev` is the rank from the most recent table snapshot before this one;
 * the screen derives the trend chip from `prev - rank`. Storing prev rather
 * than the delta itself lets the table re-rank in place without the caller
 * having to recompute deltas on every refresh.
 */
export interface LeaderboardRow {
  /** Stable user id — used for navigation to the player's prediction sheet. */
  id: string;
  /** Current 1-indexed position in the league. */
  rank: number;
  /** Rank in the previous snapshot. Equal to `rank` if it's the first one. */
  prev: number;
  /** Display name. Whatever the user set — could be a handle. */
  name: string;
  /** True for the row representing the currently signed-in user. */
  isYou?: boolean;

  // Scoring breakdown. All values fit in three digits in practice; that's
  // a hard contract the column width depends on (see GRID below).
  /** Matches the player has predictions on (max = matches played). */
  M: number;
  /** Group-stage points. */
  GS: number;
  /** Group-winner points (one per correct group). */
  GW: number;
  /** Round-of-16 points. */
  KO: number;
  /** Semifinal points. */
  SF: number;
  /** Golden-boot prediction points. */
  GB: number;
  /** Champion prediction points. */
  CH: number;
  /** Total points — the canonical sort key. */
  PTS: number;
}

export interface LeaderboardProps {
  /** League name, e.g. "Group Chat United". */
  leagueName: string;
  /** Matchday number for the eyebrow ("md 8 · live"). */
  matchday: number;
  /** Sub-eyebrow status, e.g. 'live' | 'final' | 'pending'. */
  status?: string;
  /** Pre-sorted by rank. The screen does not re-sort. */
  rows: LeaderboardRow[];
  /** Optional: wire up navigation to a player's prediction sheet. */
  onOpenPlayer?: (row: LeaderboardRow) => void;
}

// ────────────────────────────────────────────────────────────────────
// Pieces
// ────────────────────────────────────────────────────────────────────

const NUMERIC = ['M', 'GS', 'GW', 'KO', 'SF', 'GB', 'CH'] as const;

/**
 * Single source of truth for the column widths — both the header and every
 * row use this. If you change one column you change all of them, and the
 * grid stays locked. Sized for a 392px-wide phone with `screen-x` padding.
 *
 * RN flex doesn't take a CSS grid template string; we map each column to
 * either a fixed width or `flex: 1` (the Player column).
 */
const COLS = {
  rank: 18,
  // player: flex 1 — fills remaining space
  numeric: 22,
  pts: 34,
} as const;

/**
 * Position trend — small filled triangle in success/danger, neutral dot on
 * hold. Tiny because it shares a row with seven numeric columns; the color
 * carries the meaning before anything else does.
 */
function TrendChip({ change }: { change: number }) {
  if (change > 0) {
    return (
      <View className="flex-row items-center gap-0.5">
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 3.5,
            borderRightWidth: 3.5,
            borderBottomWidth: 6,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#7FB069',
          }}
        />
        <Text className="font-mono text-success text-[10px]" tabular>
          {change}
        </Text>
      </View>
    );
  }
  if (change < 0) {
    return (
      <View className="flex-row items-center gap-0.5">
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 3.5,
            borderRightWidth: 3.5,
            borderTopWidth: 6,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: '#D84A4A',
          }}
        />
        <Text className="font-mono text-danger text-[10px]" tabular>
          {Math.abs(change)}
        </Text>
      </View>
    );
  }
  return (
    <View
      accessibilityLabel="position unchanged"
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(245,232,210,0.4)',
      }}
    />
  );
}

/**
 * Header row. Sticky-feel — sits at the top of the scroller with a fade
 * mask so rows scrolling underneath feel anchored. Lives in its own
 * component so the column-width contract is enforced by structure, not by
 * accidentally drifting paddings.
 */
function HeaderRow() {
  return (
    <View
      className="px-3 pb-2 pt-2 border-b border-line flex-row items-center"
      style={{ gap: 4 }}
    >
      <View style={{ width: COLS.rank }} />
      <View className="flex-1 pl-1">
        <Text className="font-mono text-[9px] uppercase text-ink-dim tracking-widest">
          PLAYER
        </Text>
      </View>
      {NUMERIC.map((c) => (
        <View key={c} style={{ width: COLS.numeric }} className="items-center">
          <Text className="font-mono text-[9px] uppercase text-ink-dim tracking-[0.08em]">
            {c}
          </Text>
        </View>
      ))}
      <View style={{ width: COLS.pts }} className="items-end pr-1">
        <Text className="font-mono text-[9px] uppercase text-brand-500 tracking-widest">
          PTS
        </Text>
      </View>
    </View>
  );
}

/**
 * One row. The whole thing is a Pressable so users can tap to drill into
 * the player's predictions; we keep the row visual minimal (no chevron) —
 * the affordance is implicit at row scale.
 *
 * `isYou` gives the row a terracotta tint and a brand-colored PTS so the
 * signed-in user finds themselves on scroll without a "scroll to me" CTA.
 */
function PlayerRow({
  row,
  onPress,
}: {
  row: LeaderboardRow;
  onPress?: (row: LeaderboardRow) => void;
}) {
  const change = row.prev - row.rank;
  const isYou = !!row.isYou;

  return (
    <Pressable
      onPress={() => onPress?.(row)}
      className="flex-row items-center py-2.5 border-b border-line/60 active:bg-ink/[0.04]"
      style={{
        gap: 4,
        backgroundColor: isYou ? 'rgba(216,107,61,0.10)' : 'transparent',
        borderRadius: isYou ? 10 : 0,
        marginHorizontal: isYou ? -6 : 0,
        paddingHorizontal: isYou ? 6 : 0,
      }}
    >
      {/* rank */}
      <View style={{ width: COLS.rank }} className="items-end pr-0.5">
        <Text className="font-mono text-[11px] text-ink-dim" tabular>
          {row.rank}
        </Text>
      </View>

      {/* name + trend */}
      <View className="flex-1 flex-row items-center pl-1" style={{ gap: 6 }}>
        <Text
          numberOfLines={1}
          className={`text-[13px] ${isYou ? 'font-semibold text-ink' : 'text-ink/90'}`}
        >
          {row.name}
        </Text>
        <TrendChip change={change} />
      </View>

      {/* numeric cells */}
      {NUMERIC.map((c) => (
        <View key={c} style={{ width: COLS.numeric }} className="items-center">
          <Text className="font-mono text-[11px] text-ink-muted" tabular>
            {row[c]}
          </Text>
        </View>
      ))}

      {/* PTS */}
      <View style={{ width: COLS.pts }} className="items-end pr-1">
        <Text
          className={`font-mono text-[14px] ${isYou ? 'text-brand-400 font-semibold' : 'text-ink font-medium'}`}
          tabular
        >
          {row.PTS}
        </Text>
      </View>
    </Pressable>
  );
}

// ────────────────────────────────────────────────────────────────────
// Screen
// ────────────────────────────────────────────────────────────────────

/**
 * Standings screen.
 *
 * Uses the Screen primitive's bones (SafeAreaView + StatusBar) but lays out
 * its own scroller so the sticky-feel header can fade against the bg color
 * — the shared Screen wraps content in a stock ScrollView that doesn't
 * expose that seam.
 *
 * For leagues over ~30 players, swap the inner ScrollView for a FlatList
 * with `stickyHeaderIndices={[0]}`. The PlayerRow component is already
 * memo-friendly (pure props, stable handlers) — wrap with React.memo at
 * the call site if the list gets big.
 */
export function LeaderboardScreen({
  leagueName,
  matchday,
  status = 'live',
  rows,
  onOpenPlayer,
}: LeaderboardProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      {/* Top bar */}
      <View className="px-5 pt-3 flex-row items-center justify-between">
        <Wordmark />
        <Text className="font-mono uppercase text-ink-dim text-[9px] tracking-widest">
          {`md ${matchday} · ${status}`}
        </Text>
      </View>

      {/* Hero */}
      <View className="px-5 pt-7">
        <Text variant="eyebrow">{`${leagueName.toUpperCase()} · TABLE`}</Text>
        <Text
          variant="display"
          className="mt-1.5 leading-[1.02] tracking-tight"
          style={{ fontSize: 30 }}
        >
          Standings <Text tone="brand">·</Text> wk 04
        </Text>
        <Text className="mt-1.5 font-mono uppercase text-ink-muted text-[11px] tracking-[0.14em]">
          {`${rows.length} players · updated 2 min ago`}
        </Text>
      </View>

      {/* Table */}
      <View className="flex-1 mt-5">
        <ScrollView
          stickyHeaderIndices={[0]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* sticky header — wrapped in a bg View so the fade against scroll
              rows is clean, not transparent against a moving row. */}
          <View className="bg-bg px-3">
            <HeaderRow />
          </View>

          <View className="px-3">
            {rows.map((r) => (
              <PlayerRow key={r.id} row={r} onPress={onOpenPlayer} />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
