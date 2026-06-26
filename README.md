# Cleaning SaaS Platform

A multi-tenant booking and operations platform for cleaning companies in
Sweden — built end-to-end with Next.js, Express, Prisma, and Stripe Connect.
Each company gets its own customers, staff, bookings, invoicing, and
RUT-avdrag (Swedish tax deduction) handling, fully isolated from every other
company on the platform.

**Live demo:** https://cleaning-saas-platform-web.vercel.app

---

## Why this project exists

Most portfolio projects are CRUD-with-auth tutorials. This one solves a real,
specific problem: Swedish cleaning companies need to calculate and file
RUT-avdrag (a 50% government tax deduction on household services) correctly,
take online payments, and run their bookings/staff — and there's no good
self-serve tool for it. This platform handles all three, and is built as a
genuine multi-tenant SaaS (not just "one app, one customer").

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tailwind, NextAuth |
| Backend | Express, Prisma, PostgreSQL |
| Payments | Stripe Connect (Express accounts, per-transaction platform fee) |
| Auth | JWT access/refresh tokens + Google OAuth, NextAuth session layer |
| Infra | Turborepo monorepo (pnpm workspaces) |

## Core features

- **Multi-tenant architecture** — every company's data (users, bookings,
  invoices, services) is scoped by `companyId` at the database and route
  level. A platform-owner (`superadmin`) role sees and manages every company
  from a separate `/platform` panel; company admins only ever see their own.
- **Self-serve company signup** — new cleaning companies can sign up,
  pick a slug (with live availability checking), and get a branded
  booking page in minutes — no manual onboarding.
- **Booking + scheduling** — customers book by service + property +
  time slot; staff get assigned to jobs; admins manage a day/week view.
- **RUT-avdrag automation** — the platform calculates the 50% RUT
  deduction on every eligible booking (capped at the legal annual limit per
  person), generates compliant invoices, and tracks the actual claim
  lifecycle (`pending → submitted → approved/rejected`) so the company can
  reclaim that money from Skatteverket — including a CSV export for filing
  and a personnummer field that's AES-256-GCM encrypted at rest.
- **Stripe Connect payments** — each company connects their own Stripe
  Express account; customer payments land directly in the company's bank
  account, with the platform taking a configurable application fee
  automatically.
- **Platform-owner dashboard** — cross-company revenue, company health
  (active/trialing/churned), and the ability to toggle a company's plan or
  access from a single screen.

## What's deliberately not built (yet)

Being upfront about this matters more than pretending it's finished:

- No live Skatteverket API integration (requires certificates this project
  doesn't have access to) — RUT claims are tracked and exported as CSV for
  manual filing instead of auto-submitted.
- No automated recurring subscription billing for company plan tiers yet
  (tiers exist as a data field; charging for them monthly isn't wired up).
- No S3 file storage or Fortnox accounting integration — both are scaffolded
  in the schema/env but not implemented.

## Architecture

```
apps/
  web/     — Next.js frontend (customer booking flow, admin dashboard,
             platform-owner panel)
  api/     — Express API (auth, bookings, invoicing, RUT claims, Stripe
             Connect, platform analytics)
packages/
  types/   — shared TypeScript types between web and api
```

Multi-tenancy is enforced in two places: every Prisma query in `apps/api` is
scoped by `companyId` from the authenticated user's JWT, and a `resolveCompany`
middleware resolves the active tenant per-request.

## Running locally

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # fill in DATABASE_URL etc.
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Testing & CI

```bash
pnpm test     # API unit tests (Jest + Supertest), run per-package via Turborepo
pnpm lint     # ESLint across both apps
pnpm build    # type-checks and builds both apps
```

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, tests, and
a full build against a real Postgres service container on every push and
pull request to `main`.

Test coverage currently focuses on the multi-tenant resolution logic
(`resolveCompany`) — including a regression suite for a real production bug
where the API's own PaaS hostname (`*.onrender.com`) was mistakenly parsed as
a tenant subdomain — and the RUT personnummer validator.

## Deploying

See [DEPLOYMENT.md](./DEPLOYMENT.md) for a full free-tier deployment guide
(Neon + Render + Vercel, zero cost).
