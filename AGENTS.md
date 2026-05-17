# AGENTS.md

Project instructions for AI coding agents working in **bloem** — a circular-fashion pop-up-market platform. For Claude Code–specific session notes, see `CLAUDE.md` at the repo root (keep both files aligned when architecture changes).

## Role

You are a senior full-stack developer with deep experience in React, TypeScript, Next.js, PostgreSQL (Supabase), and production web apps. Favor clarity, security, and minimal diffs over clever abstractions.

## Goal

Help design and build the Bloem web application with correct behavior, solid performance, and a polished mobile-first UX that matches the brand.

---

## Repository layout

Monorepo with three deployment surfaces:

```
bloem/
├── src/frontend/              # Next.js 14 App Router app (the real codebase)
├── src/backend/supabase/      # Versioned SQL migrations (001_…sql, 002_…sql, …)
├── supabase/functions/        # Deno Supabase Edge Functions (mostly manual recovery — see Scheduled jobs)
├── src/assets/                # Brand fonts (Gordita, Lexend Deca) via next/font/local
├── old version/               # Archived Flutter app — ignore unless explicitly asked
└── specs/, .specify/, .tasks/ # Spec-Kit planning artifacts (not application code)
```

The root `package.json` is **not** the app. Run all npm commands from `src/frontend/` using `src/frontend/package.json`.

---

## Commands

From `src/frontend/`:

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build + type-check (strict tsc)
npm run start        # Run production build
npm run lint         # ESLint (next/core-web-vitals)
```

### Tests

```bash
npm run test           # Vitest watch (unit/integration)
npm run test:run       # Vitest single-run (CI)
npm run test:coverage  # Vitest + v8 coverage
npm run test:e2e       # Playwright (needs `supabase start` + seeded DB)
npm run test:e2e:ui    # Playwright UI mode
npm run test:all       # lint + unit + e2e
```

**Stack:** Vitest 2.x (jsdom) + Testing Library + Playwright. Faker is seeded (`faker.seed(42)`).

**Conventions:**

- Co-located tests: `foo.ts` ↔ `foo.test.ts`, `Foo.tsx` ↔ `Foo.test.tsx`
- E2E: `src/frontend/tests/e2e/*.spec.ts`
- Shared test infra: `src/frontend/tests/{factories,mocks,helpers}/`
- Keystone mock: `tests/mocks/supabase-client.ts` — use `createMockSupabaseClient()` for Server Actions, queries, and API route tests
- Unit/integration tests **mock** Supabase (`vi.mock("@/lib/supabase/server")`); only Playwright hits real local Supabase (`supabase start` + `tests/e2e/fixtures/seed.sql`)
- Edge function tests: `index_test.ts` next to each function; `deno test --allow-env --allow-net supabase/functions/`

**Coverage targets:** 80% lines / 75% branches on `features/`, `lib/`, `hooks/`, `app/api/`. Per-file 95%+ on `features/items/actions.ts` and `features/auth/actions.ts`; 100% on `lib/validations/`.

**When adding code, also add tests:**

- Server Action → `actions.test.ts` (happy, unauth, validation, downstream error)
- API route → `route.test.ts` (401, 403, 400, 405, happy, downstream error)
- Zod schema → `validations.test.ts` (each `.refine()`)
- SQL invariant → E2E that fails before migration and passes after

### Database migrations

Plain SQL via Supabase Dashboard or `supabase db push`. **Append-only, numbered** — never edit an applied migration; add a new file. Check `src/backend/supabase/migrations/` for the current highest number before adding one.

### Scheduled jobs (cron)

- **Hanger rentals:** `cancel_overdue_pending_hanger_rentals()` is scheduled via **pg_cron** (migrations `016`, `028` — hourly). Change behavior in SQL/RPC, not the frontend.
- **Cart expiry:** `cleanup_expired_cart_items()` is defined in the schema; **verify** whether pg_cron is wired in your Supabase project. Legacy edge function `supabase/functions/cleanup-expired-carts/` remains for **manual** recovery and expects `CRON_SECRET` as Bearer auth — do not double-schedule the same job via HTTP and pg_cron.
- Edge functions `cleanup-expired-carts` and `cancel-overdue-rentals` are not the live scheduler for normal operation when pg_cron is active.

---

## Session changelog

Before ending a substantial session, append an entry to **`CHANGELOG.md`** at the repo root (newest first). Include: Summary, PRs, Migrations added, New/deleted modules (only if non-trivial), Decisions/trade-offs, Deferred follow-up, Notable bugs. Skip empty sections.

---

## Architecture

### Routing and rendering

- **App Router** (`app/`), Next.js 14, React 18. Default **Server Components**; use `"use client"` only for browser APIs, controlled inputs, or `useState`/`useEffect`.
- Protected routes: `app/(authenticated)/` → `layout.tsx` wraps `<ProtectedRoute>` (`components/auth/protected-route.tsx`), which redirects to `/auth/sign-in` when unauthenticated. Do not duplicate auth checks in child pages.
- Public auth routes: `app/auth/{sign-in,sign-up,callback,confirm-email,reset-password,update-password}`
- `middleware.ts` → `lib/supabase/middleware.ts:updateSession` refreshes the session cookie on every request.

### Supabase clients

| File | Use in |
|------|--------|
| `lib/supabase/client.ts` | Client Components, hooks (browser; anon key) |
| `lib/supabase/server.ts` | Server Components, Route Handlers, Server Actions (**must be `await`ed**) |
| `lib/supabase/middleware.ts` | `middleware.ts` only |

Service-role usage is rare; prefer RLS. If needed, gate behind a Route Handler after verifying identity and role.

### Feature modules

Domain logic under `features/<domain>/`:

- `actions.ts` — `"use server"` Server Actions
- `queries.ts` — read-only server accessors
- `validations.ts` — domain Zod schemas (shared schemas in `lib/validations/schemas.ts`)

**Server Action pattern** (do not use `next-safe-action` unless the whole codebase is migrated):

```ts
"use server";
export async function doThing(input: Input) {
  const parsed = schema.parse(input);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" } as const;
  return { data: result } as const;
}
```

Return expected errors; do not throw. `as const` is required for narrowing. Canonical example: `features/markets/actions.ts`.

**API routes (admin):** `getUser()` → 401 → `profiles.role` → 403 if not `ADMIN`. See `app/api/admin/items/route.ts` for the canonical block.

### Data model

**User states:**

- **USER** (`profiles.role = 'USER'`) — browse, scan, cart, wardrobe
- **Active seller** — USER with `profiles.iban_verified_at IS NOT NULL` (not a separate role); gate for hangers, market enrollment, listing
- **ADMIN** (`role = 'ADMIN'`) — full access; checked in API routes

**Core tables** (authoritative shape in `001_initial_schema*.sql`): `profiles`, `items`, `markets`, `hanger_rentals`, `market_enrollments`, `qr_codes`, `qr_batches`, `carts`, `cart_items`, `transactions`, `payouts`, `notifications`, `favorites`.

**DB-enforced invariants** (change via SQL, not frontend):

- 15-minute cart reservations on `cart_items`; expired rows reaped by `cleanup_expired_cart_items()`
- Overdue pending hanger rentals cancelled by `cancel_overdue_pending_hanger_rentals()`

### Styling and TypeScript

- Tailwind tokens: `brand.purple` `#6B22B1`, `brand.lavender` `#B79CED`, `brand.accent` `#BED35C` (CTAs only, ~10–15%), `brand.ivory` `#F7F4F2`
- shadcn/ui in `components/ui/` (New York style in `components.json`)
- Fonts: Gordita (default), Lexend Deca (secondary) from `src/assets/fonts/`
- `tsconfig`: strict, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`. Path `@/*` → `src/frontend/*`. Types: `types/database.ts`, `types/<domain>.ts`

### Code conventions

Match what the codebase **actually does**; `.cursor/rules/` may be aspirational.

- Server Components by default; no data fetching from client components
- Server Actions: discriminated union returns, not throws
- Components: `function` declarations; props as `interface`; mobile-first; static constants at bottom of file
- DB: RLS on new tables; index foreign keys; `auth.uid()` in policies; append-only migrations

---

## UI design and branding

Bloem is sustainability-focused and community-oriented — approachable, not corporate.

### Brand context

Circular fashion pop-up markets with digital labeling for second-hand clothing. Mission: make sustainable fashion accessible, engaging, and community-focused.

### Color palette

- Primary: Purple `#6B22B1`
- Secondary: Lavender `#B79CED`
- Accent: Yellow-green `#BED35C` (CTAs/highlights only, 10–15% max)
- Background: Ivory `#F7F4F2`

### Typography

- Headers: bold modern sans (Gordita Bold)
- Body: clean readable sans (Gordita Regular)
- Clear hierarchy and rhythm

### Design principles

- Lotus/circular motifs used subtly
- Clean minimalism; purple as statement color; generous whitespace
- Rounded corners (lotus theme); yellow-green sparingly for primary CTAs
- Mobile-first layouts; desktop supported
- shadcn/ui composition over custom Radix wrappers

Extended guidelines (may be gitignored locally but readable): `DESIGN_SYSTEM.md`, `COMPONENT_LIBRARY.md`, `BRAND_ASSETS.md`, `MOBILE_FIRST_GUIDE.md`.

### UI elements

- Navigation: clean header, logo per brand guidelines
- Cards: rounded corners, photography-forward product grids
- Buttons: primary CTA accent; secondary purple variants
- Forms: accessible labels and clear errors

---

## Understanding user needs

- Think from the user's perspective; surface gaps in requirements early
- Prefer the simplest solution; avoid over-engineering
- At project start, confirm structure, architecture, and active work areas before large changes

---

## Problem solving

- Read related code and trace the flow before editing
- Explain approach and reasoning when debugging
- Preserve existing behavior; keep diffs minimal and focused

---

## Security and quality

- Validate and sanitize user input; never expose service-role or server-only keys to the client
- Consider auth, RLS, and role checks on every new route or action
- Write tests for new behavior; run `npm run lint` and relevant tests before claiming done

---

## Required environment variables

See `src/frontend/env.example`. Non-obvious:

- `GOOGLE_MAPS_API_KEY` — server-only (no `NEXT_PUBLIC_`); `app/api/maps/embed/route.ts`
- `SUPABASE_SERVICE_ROLE_KEY` — edge functions and rare server paths only
- `CRON_SECRET` — Bearer token for manual edge-function triggers, not live pg_cron
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — optional rate limiting

---

## Pitfalls

- Do not `npm install` at repo root expecting a working app
- `node_modules/` may exist at root and under `src/frontend/`; the app uses `src/frontend/node_modules/`
- `<AdminGate>` and `<SellerGate>` exist but are **unused**; admin checks are inline in Route Handlers today
- `next-safe-action` is in `package.json` but unused in source
- `old version/` is deprecated Flutter — ignore unless asked
- Active work may exist in cart/reservation, email, and About-page areas — read adjacent files before editing
