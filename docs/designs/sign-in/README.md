# Sign In — V1 · Quiet centered

Design reference for `app/(auth)/sign-in.tsx`. Hand this folder to Claude
Code as the visual target when implementing the real screen — wiring it
into auth, navigation, error handling, and analytics is engineering's
call, not design's.

## Files

| File                  | What it is                                                       |
| --------------------- | ---------------------------------------------------------------- |
| `sign-in.tsx`         | Reference component. Not drop-in — copy patterns, not the file.  |
| `Sign In.html`        | Standalone single-file browser preview. Open and look.           |
| `tailwind.extend.js`  | Token additions for `tailwind.config.js` `theme.extend`.         |
| `README.md`           | This file.                                                       |

## What this screen does

One CTA: continue with Google. Everything else is brand atmosphere:

- **Wordmark** top, with `World Cup '26 · beta` micro-eyebrow
- **Concentric badge** centerpiece — outer ring → inner ring → terracotta
  core with `FF` monogram, 12 stadium-tick marks around the rim. Pure
  Views, no SVG, no icons.
- **Tagline** in two lines (`title` variant + `title tone="brand"`),
  followed by a `body tone="muted"` sub.
- **Google SSO button** at the bottom — white pill with the official
  multi-color `G`. Required by Google's brand guidelines; don't restyle.
- **Legal** under it — Terms and Privacy as inline `caption tone="dim"`
  links.

## Non-obvious choices, with rationale

| Choice                                          | Why                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Top glow is `expo-linear-gradient`, not radial. | RN has no native radial gradient. Linear top→fade reads near-identical at phone scale and avoids a real SVG dep for one decoration.  |
| Google `G` is still inline `react-native-svg`.  | Multi-color mark. `react-native-svg` is already a peer dep of `lucide-react-native` (your icon set), so this is not a new install.   |
| Concentric badge uses Views + `transform: rotate`. | Tick marks are just rotated Views — no SVG, no asset to bundle, easy to retune (count, length, opacity) in one place.             |
| `SafeAreaView` edges on all four sides.         | Auth screens live outside the `(tabs)` layout, so there's no floating tab bar to clear — give the home indicator real estate too.    |
| Google button uses raw `Pressable`, not the `Button` primitive. | Google's brand spec is rigid (white bg, specific G placement, "Continue with Google" copy). Don't shoehorn it through variants. |
| `font-display` defaults to `Space Grotesk`.     | The two-line tagline benefits from the slightly wider numerals + tighter tracking. Body and labels stay on Inter.                    |

## Dependencies

If your project is already on Expo SDK 54 + Expo Router + NativeWind v4.2 +
TS strict, the only new install is **`expo-linear-gradient`**:

```bash
npx expo install expo-linear-gradient
```

Already-required peers used by this screen (no install needed):

- `react-native-safe-area-context`
- `expo-status-bar`
- `react-native-svg` (transitive via `lucide-react-native`)

## Tokens

`tailwind.extend.js` exports the full `theme.extend` shape. Two ways to
adopt:

**Spread:**

```js
// tailwind.config.js
const designTokens = require('./docs/designs/sign-in/tailwind.extend');

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: { extend: { ...designTokens } },
};
```

**Copy-paste:** open `tailwind.extend.js`, paste the inner properties
into your existing `theme.extend`. The file is annotated with what each
group does.

> **Important:** these are project-wide tokens, not screen-scoped. Future
> screens (Today, Predict, Leaderboard, …) reuse the same set. Don't
> duplicate per screen — promote `tailwind.extend.js` to a single source
> of truth somewhere stable in your repo and re-reference from each
> screen's design folder.

## Font weight note for Android

`font-semibold` / `font-bold` set `fontWeight` only. On Android, custom
fonts don't auto-pick a heavier file from a family — they fall back to
regular. Two options:

1. **Per-weight family tokens** (robust): register each weight as a
   separate family in `tailwind.config.js` and use class tokens like
   `font-sans-semibold` instead of combining `font-sans font-semibold`.
2. **Combined classes** (current): ship as-is for iOS-first, harden
   Android later. What the reference uses.

This isn't sign-in-specific; flagging here so it's not a surprise on
screens with heavier typography (the HUD numerals on Today, especially).

## Future deliverable contract — design output

For every screen, the design folder will contain:

1. The `.tsx` reference (not drop-in code)
2. A standalone HTML preview openable in a browser
3. `tailwind.extend.js` if any new tokens are introduced (likely just on
   the first few screens; the system should stabilize quickly)
4. This `README.md` with rationale for non-obvious choices and a
   dependency callout
