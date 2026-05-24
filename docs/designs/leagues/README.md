# Leagues — roster (tabs-resident)

Design reference for the tabs-resident leagues screen — the user's list of
memberships, with current position + trend per row and admin-only delete.
Hand this folder to Claude Code as the visual target; real persistence
(Supabase row reads, destructive deletes with server-side guardrails, push
notifications when a member is kicked) is engineering's call.

## Files

| File                  | What it is                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `leagues.tsx`         | RN reference for the screen + the delete-confirm sheet. Not drop-in.                                    |
| `Leagues.html`        | Standalone single-file browser preview. Tweaks panel cycles through headline proposals in context.     |
| `tailwind.extend.js`  | Project-wide token set. Identical to `docs/designs/sign-in/`. No new tokens introduced by this screen.  |
| `README.md`           | This file.                                                                                              |

## Route

```
/(tabs)/leagues          → LeaguesListScreen
```

This is the populated state. The empty-state onboarding gate (no leagues
yet → pick create vs join) lives elsewhere; if a delete or kick drops the
user to zero memberships, the tabs layout's guard short-circuits to that
gate.

## What the screen does

Header eyebrow `MY LEAGUES`, then a stack of row cards — one per
membership. Each row shows:

- **League name** in display weight, with an `admin` chip on rows the
  current user commissions.
- **Position + trend metric** in a mono caption line:
  - `3rd of 14   ▲ 2`         — climbed two places, success green
  - `11th of 23  ▼ 1`         — dropped one place, danger red
  - `1st of 8    ●` (blue)    — held position, a small cool-blue dot
  - Color carries the meaning so the row scans without reading.
- **Trash icon button**, admin rows only — opens a stacked bottom-sheet
  confirm with the league name in the title.

At the bottom, two CTAs:

- **Create new league** (primary, terracotta)
- **Join with code** (secondary)

Same destinations as the empty-state Chooser, reached from a populated
roster instead.

## Non-obvious choices, with rationale

| Choice                                                              | Why                                                                                                                                                                              |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trend uses semantic color, not just a glyph.                        | A `▲ 2` and a `▼ 2` look the same shape at a glance; the *direction* needs to read pre-cognitively. Success / danger carry that load; the glyph confirms.                          |
| Hold state is a blue dot, not a dash or zero.                       | Blue (`#5E9CD8`) is the only cool note in an otherwise warm palette, so it pops as the *neutral* state without leaking into the up/down semantics. A dash reads as "missing data"; a `0` reads as a stat ("you scored zero"), which is the wrong frame. No paired number — a held position has no delta to count. |
| No headline under the eyebrow.                                      | The metric line on every row already says what a headline would. The list is the explanation. The eyebrow + roster + CTAs is the whole hierarchy.                                  |
| Delete confirm is a stacked sheet, not a side-by-side dialog.       | A horizontal `Cancel | Delete` puts a destructive action one mis-tap away from a safe one on a small touch target. Stacking forces an intentional press; danger sits on top.       |
| League name in the modal title, not the button label.               | "Delete Group Chat United" on a 14px button truncates noisily and reads as a label. Putting the name in the headline keeps the button generic and the destructive copy readable.   |
| Admin tag is a small `brand-soft` pill, not a colored row stripe.   | A left-border accent on admin rows reads as a status banner; the role here is contextual metadata (what the user *can do* on this row), and a discrete chip is the right weight.   |
| Trash button only on admin rows.                                    | Non-admins can leave a league (different flow, future screen) but can't disband it. Rendering a disabled trash icon on member rows is louder than just hiding it.                  |
| Screens take callbacks, not router APIs.                            | `LeaguesListScreen` doesn't import from `expo-router`. Caller wires `onOpen` / `onCreate` / `onJoin` / `onDelete` to whatever the router and persistence layer are.                |
| `SafeAreaView` edges on **all four** sides.                         | Tabs-resident, so technically the bottom edge sits behind the tab bar — but the tab bar is floating, and the CTAs need real estate to clear it. Edges remain inclusive.            |
| Warm top glow reused from sign-in.                                  | Visual continuity. If we later promote it to `components/brand/WarmTopGlow.tsx`, both screens import the same file instead of duplicating the gradient.                            |

## Dependencies

Baseline (Expo SDK 54, Expo Router, NativeWind v4.2,
`expo-linear-gradient`, `react-native-safe-area-context`,
`lucide-react-native`) covers everything this screen needs.

No new modules are required:

- `Modal` for the delete-confirm sheet is built-in to `react-native`.
- The trend arrows (`ChevronUp` / `ChevronDown`) and the row delete
  icon (`Trash2`) are all in `lucide-react-native`. The hold-state blue
  dot is a raw `<View>` with a background color — no icon module needed.

## Tokens

No new tokens. `tailwind.extend.js` in this folder is identical to
`docs/designs/sign-in/tailwind.extend.js` — the file is copied so this
design folder is self-contained, but per the sign-in README the
production-side intent is to **promote one copy** of the token file to a
stable location (e.g. `design-tokens/tailwind.extend.js`) and reference
it from every screen's `tailwind.config.js`.

If you re-anchor `brand.*` later, this screen inherits the new accent
without modification — the only brand-tinted surfaces are the admin chip
and the primary CTA. The semantic trend colors (`success`, `danger`)
and the cool-blue hold dot (`#5E9CD8`) are separate tokens, deliberately,
so they don't drift with brand changes.

## Empty state

If `leagues.length === 0`, the screen renders a dashed-border placeholder
("Nothing here. Start one, or jump into a friend's pool.") in place of
the roster. The CTAs at the bottom stay put — same affordances, just no
list above them.

In practice this state is rarely reached: when a user falls back to zero
memberships, the tabs layout's guard short-circuits to the onboarding
chooser instead. The empty placeholder is a safety net for the
intermediate frame between a delete completing and the redirect firing.
