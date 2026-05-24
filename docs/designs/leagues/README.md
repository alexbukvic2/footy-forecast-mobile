# Leagues — entry flow (Chooser → Create / Join → Success)

Design reference for the league onboarding gate that sits between sign-in
and the tabs layout. Hand this folder to Claude Code as the visual target;
real persistence (Supabase row creation, code uniqueness, push-alert
opt-in, deep-link join via universal links) is engineering's call.

## Files

| File                  | What it is                                                                  |
| --------------------- | --------------------------------------------------------------------------- |
| `leagues.tsx`         | Reference for all four screens, exported as named components. Not drop-in.  |
| `Leagues.html`        | Standalone single-file browser preview — the full flow in one phone.        |
| `tailwind.extend.js`  | Project-wide token set. Identical to `docs/designs/sign-in/`. No new tokens introduced by this screen. |
| `README.md`           | This file.                                                                  |

## Route map

```
/(onboarding)/leagues          → LeaguesChooserScreen     (gate: no league yet)
   ├─ /leagues/create          → LeaguesCreateScreen
   └─ /leagues/join            → LeaguesJoinScreen
                                   ↓ (both flows on success)
                                 LeaguesSuccessScreen      (/leagues/joined)
```

The chooser is rendered only when the authed user has zero league
memberships. As soon as `memberships.length ≥ 1`, this whole stack is
short-circuited to `/(tabs)/today` — the screens are an interstitial, not a
permanent destination.

Suggested guard, expressed as a layout effect in `app/(onboarding)/leagues/_layout.tsx`:

```ts
const { memberships, loading } = useMemberships();
if (loading) return <Splash />;
if (memberships.length > 0) return <Redirect href="/(tabs)/today" />;
```

## What these screens do

### 01 · Chooser (`LeaguesChooserScreen`)

Typography-led empty state. Eyebrow `ROSTER · EMPTY`, two-line display
headline (`Now pick a side.` in `brand`), two explainer mini-cards
(`Plus` / `CheckSquare` from lucide), and two stacked CTAs —
`Create a league` (primary) and `Join with code` (secondary). No
hero illustration; the type does the work.

### 02 · Create (`LeaguesCreateScreen`)

Single labeled `Input` for league name (3–32 chars, live char counter via
the `rightAddon` slot) and one primary CTA. The join code is generated
server-side at create time and surfaced on the Success screen — we don't
preview it here so the creator doesn't fixate on a value that might not
be the one they actually get.

### 03 · Join (`LeaguesJoinScreen`)

Six segmented monospace tiles, separated by a soft `·` between tiles 3 and
4. All the affordances you'd expect:

- Auto-advance on character entry
- Backspace clears the current tile, or jumps back if already empty
- Paste fills as many tiles as fit, starting at the focused index
- Input is normalized: uppercased, stripped to `A–Z 0–9`
- Submit is disabled until all six are filled

On submit, the screen `await`s the provided `onJoin(code)` callback. If
the promise rejects, its `.message` is shown inline under the tiles in
`tone="danger"`. The screen owns its loading state — the caller doesn't
need to thread `setLoading` through.

### 04 · Success (`LeaguesSuccessScreen`)

Shared confirmation for both flows. Green eyebrow (`LEAGUE CREATED` for
the creator, `YOU'RE IN` for joiners) with a `bg-success` dot, league name
as the `display` headline, a `<Card tone="raised">` showing the join code
with a `copy` button that swaps to a green `check` for ~1.5s after tap,
and a two-up `MEMBERS · CREATED` stat strip. The CTA copy is identical
across flows: `Go to today's matches`.

## Non-obvious choices, with rationale

| Choice                                                              | Why                                                                                                                                                                              |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code alphabet excludes `0 1 I O`.                                   | Codes get read aloud in group chats, written on a sticky, screenshotted, sometimes OCR'd. Removing the ambiguous glyphs is cheap and avoids the most common transcription bugs.   |
| 6 chars over a 32-char alphabet (~30 bits).                         | Comfortable headroom for collisions in the realistic ceiling of the userbase; short enough to dictate over a noisy bar.                                                          |
| Six raw `<TextInput>`s, not `Input size="score"`.                   | The `score` variant is a tall 80×80 tile sized for HUD score entry. Code tiles want a narrower 48×56 rhythm; rather than fork the variant, the join screen renders raw inputs.   |
| No code preview on Create.                                          | The code is generated server-side at commit time; showing a placeholder beforehand invites the creator to memorize a value they may not actually get. The Success screen reveals it.   |
| Auto-advance + paste-spread + backspace-back on the code tiles.     | Matches the user's mental model of "one big input that happens to be visually segmented." Anything less is irritating after the second wrong tap.                                |
| Chooser uses raw `<View>` explainer cards, not `<Card>`.            | They're decorative previews, not interactive surfaces. `<Card>`'s eyebrow/title slots would mis-style them and the press-state would suggest a tap target that doesn't exist.    |
| Screens take callbacks, not router APIs.                            | `LeaguesJoinScreen` doesn't import from `expo-router`. Caller wires `onJoin`/`onBack`/`onContinue` to whatever the router is. Trivial for tests + Storybook.                     |
| `SafeAreaView` edges on **all four** sides.                         | Same reasoning as sign-in — onboarding lives outside the tabs frame; the floating tab bar isn't there to clear, so give the home indicator real estate too.                       |
| Top warm glow reused from sign-in.                                  | Visual continuity from the previous screen. If we later promote it to `components/brand/WarmTopGlow.tsx`, both screens import the same file instead of duplicating the gradient. |

## Dependencies

If the project is already on the sign-in baseline (Expo SDK 54, Expo
Router, NativeWind v4.2, `expo-linear-gradient`, `react-native-svg`,
`react-native-safe-area-context`, `lucide-react-native`), then the only
new install is **`expo-clipboard`** — for the `copy` button on the
Success screen:

```bash
npx expo install expo-clipboard
```

If you'd rather not pull a new module just for that one button, swap
`Clipboard.setStringAsync(league.code)` for `react-native`'s built-in
`Clipboard` (deprecated but functional) or drop the copy affordance and
let users long-press the code text to copy via the system menu.

## Tokens

No new tokens introduced by this screen. `tailwind.extend.js` in this
folder is identical to `docs/designs/sign-in/tailwind.extend.js` — the
file is copied so this design folder is self-contained, but per the
sign-in README, the production-side intent is to **promote one copy** of
the token file to a stable location (e.g. `design-tokens/tailwind.extend.js`)
and reference it from every screen's `tailwind.config.js`.

If you re-anchor `brand.*` for a different aesthetic direction later
(Editorial sepia, Floodlight amber), this whole flow inherits the new
accent without modification — the only brand-specific surfaces are the
small `+` / `check` icon tiles on the chooser and the green success dot,
both of which already use semantic tokens (`brand-soft`, `brand-500`,
`success`).

## Empty-state contract

A user is "leagueless" when the server returns zero memberships. Treat
that as the **only** trigger for this stack — not "first login" (a user
might have been removed from their last league and need to rejoin),
and not "no predictions yet" (which is a different empty state owned by
the Today screen). The chooser is reached again any time a user falls
back to zero memberships, e.g. via league deletion or a kick.

## Future deliverable contract — design output

Same as sign-in. For every screen, the design folder will contain:

1. The `.tsx` reference (not drop-in code)
2. A standalone HTML preview openable in a browser
3. `tailwind.extend.js` (copied across folders for self-containment until
   the token file is promoted to a single source of truth)
4. This `README.md` with rationale for non-obvious choices and a
   dependency callout
