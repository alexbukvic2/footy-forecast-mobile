# Leaderboard — V1 · Dense table

Design reference for `app/(tabs)/leagues/[id]/leaderboard.tsx`. Hand
this folder to Claude Code as the visual target when implementing the
real screen — wiring it into the standings query, realtime updates,
and navigation to a player's prediction sheet is engineering's call,
not design's.

## Files

| File                  | What it is                                                       |
| --------------------- | ---------------------------------------------------------------- |
| `leaderboard.tsx`     | Reference component. Not drop-in — copy patterns, not the file.  |
| `Leaderboard.html`    | Standalone single-file browser preview. Open and look.           |
| `tailwind.extend.js`  | Project-wide token set (identical to other folders).             |
| `README.md`           | This file.                                                       |

## What this screen does

The full standings table for the league the user is currently scoped to.
Nine columns on a 392px-wide phone — Player + the seven scoring categories
(M, GS, GW, KO, SF, GB, CH) + total PTS. Pre-sorted by rank.

- **Top bar** — wordmark left, matchday status mono-eyebrow right
  (`md 8 · live`). Same chrome as Leagues.
- **Hero** — `eyebrow` with the league name, two-line title
  (`Standings · wk 04`), sub line with player count and freshness.
- **Sticky header row** — `PLAYER · M · GS · GW · KO · SF · GB · CH · PTS`,
  mono uppercase, PTS in `brand-500` to mark it as the sort key.
- **Player rows** — rank · name · trend chip · seven mono numerals ·
  total. Whole row is a `Pressable` → player's prediction sheet.
- **"You" row** — terracotta tint, brand-colored PTS, semibold name.
  Bleeds into the row padding via negative horizontal margins so the
  tinted pill spans the column grid without breaking alignment.

## Non-obvious choices, with rationale

| Choice                                          | Why                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Seven 22px columns + 34px PTS at 11px mono.     | The 3-digit-max contract on every numeric column lets us fix narrow widths and lean on mono digit metrics. Anything wider and the breakdown wouldn't fit alongside the name without horizontal scroll. |
| Numerics use the mono family, not `tabular-nums`. | RN doesn't honor `font-variant-numeric`. The mono family is the standard escape hatch — `Text` accepts a `tabular` prop that swaps to mono. Mirrored in HTML preview for visual parity. |
| Trend chip is a tiny filled triangle, not an icon. | Lucide chevrons read as "expand/collapse" affordances at 12px. A 6×6 filled triangle reads as "movement" and never competes with the row's primary numerals. Color does most of the talking. |
| "You" tint uses negative horizontal margin.     | The tinted pill needs to span past the row's column-padding so it looks like a row treatment, not a chip glued in column 1. Negative margin keeps the inner grid template untouched. |
| Single `COLS` width record + `NUMERIC` tuple.   | Header and rows both read from the same widths, so a column-width change is one edit. Same trick keeps the HTML preview's `gridTemplateColumns` string in sync at a glance. |
| `<ScrollView stickyHeaderIndices=\{[0]\}>` over `FlatList`. | The roster is bounded by league size — single-digit to low-30s in practice. `ScrollView` is simpler and the sticky-header API is more straightforward. Swap to `FlatList` if leagues ever blow past ~50. |
| Tap target = whole row, no chevron.             | Drill-in to a player's predictions is a known interaction at table scale (sportsbook, Strava, etc.) and a chevron costs a column we can't afford. Press state (`active:bg-ink/[0.04]`) carries the affordance. |

## Column legend

The two-letter codes are deliberately terse so the table fits. If you
ever want to surface their meanings inline, the canonical mapping is:

| Code | Meaning                                       |
| ---- | --------------------------------------------- |
| M    | Matches the player has predictions on         |
| GS   | Group-stage points                            |
| GW   | Group-winner points (one per correct group)   |
| KO   | Round-of-16 points                            |
| SF   | Semifinal points                              |
| GB   | Golden-boot prediction points                 |
| CH   | Champion prediction points                    |
| PTS  | Total — the canonical sort key                |

For now we don't render the legend in-screen. If usability testing
flags this, the cheap fix is a "?" icon button next to the header row
that opens a bottom sheet listing the codes; reach for that before
widening the columns or adding a second line of labels — both would
break the density that makes this layout work.

## Dependencies

If your project is already on Expo SDK 54 + Expo Router + NativeWind v4.2 +
TS strict, there are **no new installs**. Everything this screen needs
is already a peer:

- `react-native-safe-area-context`
- `expo-status-bar`
- `expo-linear-gradient` (already added by Sign In)

## Tokens

`tailwind.extend.js` is identical to the file in every other design
folder — the Broadcast tokens are project-wide, not screen-scoped. Adopt
once at the project root; see `docs/designs/sign-in/README.md` for the
spread vs copy-paste options.

## Realtime + sort contract

The screen does **not** re-sort. It expects `rows` pre-sorted by `rank`
(ascending). This keeps the render pure — the column header that says
"sorted by PTS" is a truthful invariant of the data, not a runtime
side-effect.

`prev` (previous-snapshot rank) is what drives the trend chip. Storing
`prev` rather than the delta itself lets the table re-rank in place on
every refresh without the caller having to recompute deltas. On the
first snapshot of a league, set `prev = rank` everywhere and the chips
will all render as the neutral "held" dot.

## Future work

- **Pin "you" on scroll.** When the user's row scrolls off-screen, a
  pinned bar at the bottom (or top) should show their current rank and
  PTS. Same row visual treatment, lighter elevation. Not in V1.
- **Filter by scoring category.** Tap a column header to sort by that
  column (with the canonical `PTS` sort always available as a reset).
  Not in V1 — keep the screen as the league's source of truth first.
- **Empty / pre-tournament state.** Before any matches are scored, every
  numeric column is `0` and the table is sorted alphabetically. The row
  visual handles this without changes; only the eyebrow copy needs to
  swap (`md 0 · pre`).
