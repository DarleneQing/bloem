# Bloem — Circular Fashion Marketplace

A web platform for pop-up second-hand fashion markets. Sellers list preloved items in a digital wardrobe, rent hangers at physical market events, and label items with QR codes; buyers scan, cart, and check out on the spot.

**Live at [letsbloem.com](https://letsbloem.com)**

## How it works

1. **Sellers** upload items to their digital wardrobe, verify an IBAN to activate selling, enroll in a market, and rent hangers.
2. **At the market**, each item gets a QR-coded hanger tag linking the physical garment to its digital listing.
3. **Buyers** scan a QR code to see item details, add to cart (15-minute reservation), and pay by card.
4. **After the market**, sellers receive payouts directly to their IBAN.

## User roles

| Role | Gate | Capabilities |
|---|---|---|
| **User (buyer)** | default | Browse markets, scan QR codes, cart & checkout, personal wardrobe |
| **Active seller** | IBAN verified (`profiles.iban_verified_at`) | + rent hangers, enroll in markets, list items for sale, receive payouts |
| **Admin** | `profiles.role = 'ADMIN'` | Market/user/item management, QR batch generation, payouts, analytics |

## Tech stack

- **Frontend:** Next.js 14 (App Router, Server Components), TypeScript (strict), Tailwind CSS + shadcn/ui, Zod + react-hook-form
- **Backend:** Supabase (Postgres + RLS, Auth, Storage, `pg_cron`), Next.js Server Actions and Route Handlers
- **Payments:** Stripe (cards, seller payouts)
- **Email:** Resend
- **Hosting:** Vercel

## Repository layout

```
bloem/
├── src/frontend/            # The Next.js app (work here)
├── src/backend/supabase/    # Versioned SQL migrations (append-only, numbered)
├── supabase/functions/      # Deno edge functions (manual-recovery triggers)
├── src/assets/              # Brand fonts (Gordita, Lexend Deca)
├── specs/                   # Planning artifacts (Spec-Kit)
└── old version/             # Archived Flutter implementation — ignore
```

> The root `package.json` is repo tooling only. The app's real `package.json` lives in `src/frontend/`.

## Getting started

Prerequisites: Node.js 18+, a Supabase project, Stripe and Resend accounts.

```bash
git clone https://github.com/DarleneQing/bloem.git
cd bloem/src/frontend
npm install
cp env.example .env.local   # then fill in credentials
npm run dev                  # http://localhost:3000
```

Apply database migrations from `src/backend/supabase/migrations/` in order, via the Supabase Dashboard SQL Editor or `supabase db push`.

## Development

All commands run from `src/frontend/`:

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (doubles as strict type-check) |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit/integration (watch) |
| `npm run test:run` | Vitest single run (CI mode) |
| `npm run test:e2e` | Playwright E2E (needs `supabase start` + seeded DB) |
| `npm run test:all` | lint + unit + e2e |

CI (`.github/workflows/test.yml`) runs lint, unit tests, and edge-function tests in parallel, plus an E2E job against a local Supabase. PR merges are gated on a green check.

## Documentation

- [Requirements & User Stories](<./Requirements - User Stories.md>) — user stories and acceptance criteria
- [Implementation Plan](<./Implmentation Plan.md>) — technical implementation guide
- [Roles](./Roles.md) — user roles and permissions
- `AGENTS.md` — instructions for AI coding agents

Design guidelines (`DESIGN.md`, `DESIGN_SYSTEM.md`, `COMPONENT_LIBRARY.md`, `BRAND_ASSETS.md`, `MOBILE_FIRST_GUIDE.md`) are kept locally and not committed.

## License

Proprietary — all rights reserved.
