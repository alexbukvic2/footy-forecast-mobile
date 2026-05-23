# CLAUDE.md — footy-forecast-mobile

You are working on the React Native mobile client for **footy-forecast**, a
prediction game for major football (soccer) tournaments — currently the World
Cup. Users predict match results, group winners, top scorer, and the eventual
champion. Players join private leagues and compete on global and per-league
leaderboards.

The backend is a separate repo: `github.com/alexbukvic2/footy-forecast`.
Production API: `https://footy-forecast.hexagonon.net`.

Read this file fully before making any change. When in doubt, ask before
acting; do not silently invent conventions.

## Stack

- Expo (managed workflow) — specific SDK version in `package.json`
- React Native + React per the Expo SDK
- TypeScript — strict mode, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  no `any`
- Expo Router (file-based, built on React Navigation v7)
- TanStack Query v5 for server state (all API data)
- NativeWind v4 with Tailwind v3 for styling (Tailwind-style utilities;
  do NOT upgrade to NativeWind v5 / Tailwind v4 without explicit discussion)
- AWS Cognito for auth (Google federated SSO), via `expo-auth-session` (PKCE)
- `expo-secure-store` for token storage
- Jest + React Native Testing Library for tests

EAS (Expo Application Services) handles builds, app store submission,
OTA updates.

## Architecture

Flat layout at the repo root (no `src/` prefix). Path alias `@/*` resolves
to `./*`.
app/           ← Expo Router route tree
_layout.tsx  ← root layout; mounts providers; auth-gate redirect
(auth)/      ← route group; sign-in and related screens
(tabs)/      ← route group; main app, behind auth gate
api/           ← typed API client; one file per backend resource
components/    ← reusable components (Button, Card, ListItem, etc.)
hooks/         ← shared hooks (useCurrentUser, useTournaments, etc.)
auth/          ← Cognito session management, token storage, refresh
types/         ← shared TS types; api.ts is generated from backend OpenAPI
theme/         ← design tokens, colors, spacing constants
utils/         ← pure helpers

**Strict rules:**

1. **Route files don't call `fetch` directly.** All API calls go through `api/`.
2. **API responses are typed via generated types** in `types/api.ts`.
   Never hand-write types that mirror backend types. Run `npm run gen:api`
   to regenerate from the backend OpenAPI spec.
3. **TanStack Query for all server data.** No `useEffect` + `fetch` patterns.
   Every API call is a `useQuery` or `useMutation` hook.
4. **No `any`.** Use `unknown` and narrow, or define a proper type.
5. **Components are functional only.** No class components.
6. **Styling via NativeWind.** No inline `style={{...}}` except for dynamic
   values that can't be expressed as Tailwind classes.
7. **Errors surfaced visibly.** No silent catches. Show a toast, a screen-
   level error UI, or a retry button.
8. **Loading states are explicit.** No spinners-everywhere defaults; pick
   what the user should see per screen.

## API contract

Backend serves OpenAPI 3 spec at `/openapi.json` (TODO: ensure backend
exposes this; if not, hand-maintain `types/api.ts` until it does).

```bash
npm run gen:api    # fetches OpenAPI, writes to types/api.ts
```

The API client (`api/`) imports types from there and exposes typed
functions. Example:

```ts
// api/tournaments.ts
import type { paths } from "@/types/api";
type Tournament = paths["/tournaments/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

export async function getTournament(id: string): Promise<Tournament> { ... }
```

## Authentication

- OAuth 2.0 + PKCE against AWS Cognito User Pool with Google as federated
  identity provider
- `expo-auth-session` handles the browser-based flow
- Tokens (ID, access, refresh) stored in `expo-secure-store`
- Access token attached as `Authorization: Bearer <token>` to API requests
- Background refresh when access token nears expiry (refresh handled by a
  TanStack Query mutation invoked from an interceptor)
- On 401 from API: trigger refresh once; if that fails, sign out

Cognito User Pool ID and client ID live in `app.config.ts` under `extra`,
fed from environment variables at build time. Never hardcoded in source.

## Navigation

Expo Router, file-based. Route groups (folders in parentheses) organize
files without adding URL segments.

- `app/_layout.tsx` — root layout. Mounts global providers
  (QueryClientProvider, eventually auth context). Renders the auth gate.
- **Auth gate:** the root layout checks session state and uses
  `<Redirect href="/sign-in" />` to bounce unauthenticated users to the
  auth group; authenticated users see the tabs.
- `app/(auth)/_layout.tsx` — Stack navigator for auth screens.
  `app/(auth)/sign-in.tsx` is the sign-in screen.
- `app/(tabs)/_layout.tsx` — Tabs navigator for the main app.
  Tab screens (e.g. `app/(tabs)/index.tsx`) are siblings.

For typed links, use Expo Router's typed `href` and the generated route
types in `.expo/types/`.

## Testing

- Unit tests for utility functions and hooks (`__tests__/` next to source)
- Component tests via React Native Testing Library for screens with logic
- No tests for trivial layout-only components
- Mock the API layer (`api/`) in tests; do not mock fetch directly
- Aim for tests on auth, predictions submission, leaderboard logic.
  Don't test the framework.

## Commands

```bash
npm install              # install deps
npm run start            # start Expo dev server (Metro)
npm run ios              # run on iOS simulator
npm run android          # run on Android emulator
npm run test             # run Jest tests
npm run lint             # eslint
npm run typecheck        # tsc --noEmit
npm run gen:api          # regenerate API types from backend OpenAPI
npx eas build --platform ios|android   # production build via EAS
```

Before declaring a task done:
```bash
npm run lint && npm run typecheck && npm run test
```

## Working with planning artifacts

Non-trivial features get a plan in `docs/plans/<slug>.md` before
implementation. Planning happens in conversation (typically a separate
chat session focused on tradeoffs), the resulting plan is committed,
and implementation references it.

The current workflow is **two agents plus a human reviewer**:
- **Planner** — conversation in chat (Claude.ai or similar) where
  decisions, sequencing, and tradeoffs are worked out. Output: a plan
  file in `docs/plans/`.
- **Implementer** — Claude Code in the editor, executing the agreed plan
  against the live repo.
- **Reviewer** — the human (you), reading the diff before push.

A dedicated reviewer agent may be added later if diffs grow large
enough that human review misses things. For now it's overhead.

Architectural decisions: `docs/decisions/NNNN-title.md` (ADR-style).

## Things to never do

- Never commit secrets — Cognito IDs go in env, not source
- Never hardcode the API base URL outside `api/config.ts`
- Never reach into the backend repo for shared types — use generated types
- Never bypass the auth interceptor by calling `fetch` directly
- Never silently swallow errors — surface them
- Never introduce a new dependency without justification
- Never use `Alert.alert` for errors users need to recover from —
  use proper UI

## When you're unsure

Ask. A clarifying question is cheaper than a wrong implementation.