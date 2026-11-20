# AGENTS.md — Development & Operating Guidelines for Market Research (Supabase)

This document serves as the single source of truth for AI agents and human developers maintaining and extending the **Market Research** application.

---

## 1. Project Overview & Philosophy

- **App Purpose:** Fast, mobile-first PWA for field market research and sales inquiry logging (e.g. selling cats/kittens, products at field markets).
- **Hosting:** 100% Free on Vercel as a static PWA.
- **Database:** **Supabase (PostgreSQL Cloud)**. All data persists reliably in Supabase.
- **No Complex Sync / CRDT:** Reads and writes directly to Supabase over HTTPS. No local-first sync engine.
- **Network Safety Rule:** When network connection is lost or Supabase is unreachable, display an instant, real-time, full-screen blocking overlay. Never allow unconfirmed writes while offline.
- **Mobile Ergonomics:** High touch contrast, min 48px tap targets, thumb-friendly bottom nav, one-tap question chips, quick-stepper price logs.

---

## 2. Directory Structure

```
market-research/
├── PRD.md                         # Product Requirements Document
├── AGENTS.md                      # Agent & Developer Operating Instructions
├── ARCHITECTURE.md                # System Architecture & Data Model
├── supabase/
│   └── schema.sql                 # 1-click SQL migration for Supabase SQL Editor
├── package.json                   # Root package definition & scripts
├── vite.config.ts                 # Vite + PWA configuration
├── tailwind.config.js             # Mobile-first Tailwind styling
├── .env.example                   # Example environment variables (VITE_SUPABASE_URL, etc.)
├── src/
│   ├── main.tsx                   # Client entry point
│   ├── App.tsx                    # App routing & root shell
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client & fallback provider
│   │   └── seed.ts                # Initial seed data utility
│   ├── components/
│   │   ├── common/                # OfflineOverlay, Header, BottomNav, Card
│   │   ├── products/              # ProductCard, ProductModal, IconPicker
│   │   ├── visits/                # VisitSelector, VisitModal, VisitTimeline
│   │   ├── interactions/          # QuickLoggerModal, QuestionChips, PriceStepper
│   │   └── analytics/             # MarketSummary, InquiryChart, PriceDistribution
│   ├── context/
│   │   ├── NetworkContext.tsx     # Real-time online/offline + Supabase ping probe
│   │   └── AppContext.tsx         # Active visit, selected product, active state
│   ├── services/
│   │   └── dataService.ts         # Unified data service (Supabase client + seed fallback)
│   └── types/
│       └── index.ts               # TypeScript data models & database definitions
└── tsconfig.json
```

---

## 3. Key Engineering Standards

### 3.1. Online/Offline & Overlay Rules
- `NetworkContext` MUST maintain:
  - `isOnline`: boolean (combining `navigator.onLine` AND active Supabase connection probe).
  - `isChecking`: boolean (during reconnect attempts).
  - `lastPingSuccess`: timestamp.
- The `OfflineOverlay` component MUST:
  - Render with highest z-index (`z-[9999]`) and backdrop blur.
  - Trap all clicks/taps so no user action can trigger while offline.
  - Automatically test Supabase connectivity every 3 seconds while offline to detect reconnection.
  - Provide a "Retry Connection" button for immediate manual retry.
  - Dismiss automatically when connectivity is verified.

### 3.2. Supabase Integration
- Configuration loaded via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Include `supabase/schema.sql` with tables:
  - `products`: `id, name, breed_or_type, target_price, min_acceptable_price, icon_type, icon_value, status, sold_price, sold_at, notes, created_at`
  - `visits`: `id, visit_date, title, location, notes, created_at`
  - `interactions`: `id, visit_id, product_id, questions, custom_question, offered_price, customer_sentiment, customer_notes, created_at`
- If environment variables are empty, the app runs in a pre-configured demo mode with standard sample data so developers and users can test immediately.

### 3.3. Mobile UX & Fast Card Interaction Rules
- **One-Tap Question Logging:** Tapping a chip immediately toggles or adds it to the active inquiry log.
- **Quick Price Stepper:** Offer cards must provide direct buttons for `+$10`, `+$25`, `+$50`, `+$100`, and common quick presets ($200, $300, $400, $500, etc.) in addition to direct numeric input.
- **Sale Confirmation Dialog:** Changing product status to `SOLD` requires confirming the final sold price and optional buyer note.
- **Haptic Touch:** Use `if (navigator.vibrate) navigator.vibrate(10);` for tactile confirmation on primary buttons.

---

## 4. Development & Running Commands

```bash
# Node path setup (in custom nvm/Node 24 environment):
export PATH="/home/ashfatul/.config/nvm/versions/node/v24.22.3/bin:$PATH"

# Install dependencies:
npm install

# Start Vite development server:
npm run dev

# Run build for production:
npm run build

# Preview production build:
npm run preview
```

---

## 5. Testing & Quality Checklist

Before submitting any code changes, verify:
1. `npm run build` passes with zero TypeScript or bundle errors.
2. Simulating offline mode in DevTools immediately brings up the full-screen blocking overlay.
3. Restoring network immediately dismisses the overlay and resumes normal interaction.
4. Adding an interaction or changing sold status persists in Supabase.
5. Mobile viewport looks crisp and properly scaled on 375px, 390px, and 412px widths with bottom navigation accessible.
