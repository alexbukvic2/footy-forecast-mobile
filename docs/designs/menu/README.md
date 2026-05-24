# Menu — bottom tab bar

Design reference for the floating bottom tab bar that lives on every
authed screen. Two tabs for now (Profile, Leagues); the bar is built so
adding a third (e.g. Today's matches, Notifications) is a one-entry
change to the `TABS` constant.

This is a **component**, not a screen — it doesn't own a route. It sits
in `app/(tabs)/_layout.tsx` as the `tabBar` render-prop of an
expo-router `Tabs` layout, overlaying whatever screen is mounted below.

## Files

| File                  | What it is                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `menu.tsx`            | RN reference for the `<TabBar />` component + `TABS` constant. Not drop-in.                             |
| `Menu.html`           | Standalone single-file browser preview. Tap each tab to flip the active state.                          |
| `tailwind.extend.js`  | Project-wide token set. Identical to the other design folders. No new tokens introduced by this bar.    |
| `README.md`           | This file.                                                                                              |

## Integration

```ts
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { TabBar } from '../../docs/designs/menu/menu';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar
          active={props.state.routes[props.state.index].name}
          onChange={(id) => props.navigation.navigate(id)}
        />
      )}
    >
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="leagues" />
    </Tabs>
  );
}
```

Each tab id matches the route name (`profile`, `leagues`) so the active
state derives from the navigation state without a separate lookup.

## What the bar does

- Floats above the home indicator (not edge-to-edge): `mx-3 mb-3`,
  `rounded-tab` (22px), `shadow-tab`. Reads as overlay chrome rather
  than chrome that fights the content beneath it.
- Equal-width tab columns, regardless of count, via a grid that
  auto-distributes `TABS.length`.
- Per tab:
  - **Icon** (20px lucide stroke, weight `1.7 → 2.1` on active)
  - **Label** below, mono uppercase, `10.5px`, tracking `0.18em`
  - **Active backplate**: small brand-soft pill (40×24, rounded-full)
    behind the icon — Material-3 style
- Active color: `brand-500` on icon + label. Inactive: `ink-muted`.

## Tabs

| `id`      | Label     | Icon (lucide) | Route             |
| --------- | --------- | ------------- | ----------------- |
| `profile` | Profile   | `User`        | `/(tabs)/profile` |
| `leagues` | Leagues   | `Trophy`      | `/(tabs)/leagues` |

`Trophy` over a generic `List` for Leagues because the screen is about
competition — who's winning where on the table — not about a neutral
list of items. Re-anchor to `Users` / `ListOrdered` if that framing
changes later.

## Non-obvious choices, with rationale

| Choice                                                              | Why                                                                                                                                                                              |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Floating bar, not edge-to-edge.                                     | The sign-in / leagues screens already use `SafeAreaView` edges on all four sides on the assumption the tab bar is floating. An anchored edge-to-edge bar would either require those screens to reserve bottom padding or get clipped behind it.                |
| Active cue is a backplate pill **plus** color shift, not just one.  | Either alone would technically suffice, but the pill is the spatial anchor and the color carries the meaning — together they make the active tab pre-cognitive at a glance.       |
| Mono uppercase labels, not sentence-case sans.                      | Tab labels are a taxonomy label, same role as the eyebrow / admin chip / "X active" stat. Matching their voice keeps the app's hierarchy of label-vs-content readable.            |
| 10.5px label size (not the smaller 9px used on the wordmark).       | Tab labels are a primary navigation affordance and need to clear accessibility minimums; the wordmark subtitle is decorative metadata at a glance.                                |
| Icon stroke bumps from 1.7 to 2.1 on active.                        | A 0.4 stroke increase is subtle but reads as "weight" without making the active icon a different shape. Lucide doesn't ship filled variants, so this is the cleanest way to differentiate without forking icon assets. |
| Grid auto-distributes columns, not flex with `flex-1` per tab.      | Grid keeps every column exactly equal even when one label wraps; with flex, a `Notifications` tab next to a `Today` tab would size differently. Grid is one-line-cheaper too.     |
| Bar uses its own `shadow-tab` token (heavier than `shadow-card`).   | A floating element over scrolling content needs a softer-but-deeper shadow to "lift" off the surface. The card shadow is sized for stationary cards, not overlay chrome.          |
| Component takes `active` + `onChange`, not router APIs.             | `TabBar` doesn't import from `expo-router` — the `_layout.tsx` wires the navigation state to the props. Trivial to drop into Storybook or test with a `useState` parent.          |

## Adding a third tab

Append to `TABS`, add a matching `Tabs.Screen` in `_layout.tsx`, drop a
`<id>.tsx` file under `app/(tabs)/`. The grid auto-redistributes.

```ts
// menu.tsx
export const TABS: TabSpec[] = [
  { id: 'today',   label: 'Today',   Icon: CalendarClock },
  { id: 'profile', label: 'Profile', Icon: User          },
  { id: 'leagues', label: 'Leagues', Icon: Trophy        },
];
```

A 3-tab bar is the sweet spot for this layout. Past 4 the labels start
to feel cramped at 10.5px on small devices — at that point either drop
labels-on-inactive (icon-only when not active, label appears on tap) or
swap to a different mono size.

## Dependencies

Baseline (Expo SDK 54, Expo Router, NativeWind v4.2,
`react-native-safe-area-context`, `lucide-react-native`) covers
everything this component needs. No new modules.

## Tokens

No new tokens beyond the existing project set, with the exception of one
shadow recipe:

```js
// tailwind.extend.js
boxShadow: {
  // …
  'tab': '0 12px 28px rgba(0,0,0,0.55)',  // floating overlay chrome
},
```

If you'd rather not add a new shadow, fall back to `shadow-card`; the
visual difference is subtle and only matters when the bar is floating
over light-toned content (which the warm-dark surfaces don't currently
produce).
