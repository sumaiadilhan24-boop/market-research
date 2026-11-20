# Market Research v3.0

Mobile-first field sales & market research PWA. React + TypeScript + Vite + Tailwind, with **Supabase (PostgreSQL)** as the cloud database and **Vercel** for free static hosting.

## Quick start (demo mode — no setup required)

```bash
export PATH="/home/ashfatul/.config/nvm/versions/node/v24.22.3/bin:$PATH"
npm install
npm run dev
```

With no Supabase credentials, Market Research runs in **demo mode**: sample products, visits and inquiries are preloaded, and your edits persist in the browser's local storage. This lets you try every feature immediately.

## Connect Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. Copy `.env.example` to `.env.local` and fill in:

   ```env
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   ```

4. Create a user: open **Authentication → Users → Add user** in Supabase (email + password), or use the app's **Create account** screen.
5. Restart `npm run dev` and sign in with that email and password. The **Data** tab will show `Supabase connected` and your account; all records are written directly to your database.

> Row Level Security restricts every table to the `authenticated` role — anonymous requests cannot read or write data. The SQL is re-runnable and removes older open-anon policies if present.

## Features

- **Email/password auth** — Supabase Auth sign-in, sign-up, password reset and persistent sessions; RLS blocks anonymous access. Demo mode skips login.
- **Visits** — date-based sessions, active-visit selection, timeline and per-visit inquiry counts.
- **Products** — target/min prices, status (`AVAILABLE` / `RESERVED` / `SOLD`), emoji or image icons, searchable-by-filter cards.
- **Fast logger** — switch between **I'm selling** (buyer offers) and **I'm buying** (seller quotes); one-tap question chips, `+৳10 / +৳25 / +৳50 / +৳100` steppers, quick price presets, sentiment tagging and instant save.
- **Safe sales** — 2-step sold confirmation with final price and buyer note; reopen support.
- **Insights** — inquiry counts, average/best offers, conversion, revenue, offer distribution and top questions.
- **Network safety** — browser events plus a live Supabase reachability probe; a full-screen blocking overlay appears instantly offline and auto-dismisses on reconnect (3-second retry loop while offline).
- **Backup** — one-tap JSON export, CSV export and validated JSON restore (merge or replace).
- **PWA** — installable standalone app, offline app-shell caching, maskable icons and haptic feedback.

## Commands

```bash
npm run dev      # development server
npm run build    # typecheck + production build
npm run preview  # preview production build
```

## Deploy to Vercel

Import the repo into Vercel (framework preset: Vite). Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables, then deploy. `vercel.json` handles SPA rewrites; `vite-plugin-pwa` generates the service worker and manifest.

## Project layout

```
src/
├── lib/            Supabase client + demo seed data
├── services/       unified data service, reactive provider, export/import
├── context/        network monitoring + app UI state
├── components/     common, products, visits, interactions, analytics, data
├── views/          screen compositions
└── types/          shared models
supabase/schema.sql  one-click SQL migration
```

See `PRD.md`, `ARCHITECTURE.md` and `AGENTS.md` for the full product and engineering spec.
