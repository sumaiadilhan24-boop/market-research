# Product Requirements Document (PRD)
## Project: Market Research — Field Sales & Market Research PWA (Supabase + Vercel)

**Version:** 3.0.0  
**Date:** 2026-11-20  
**Target Platform:** 100% Free Vercel PWA + Mobile Devices  
**Database Backend:** Supabase (PostgreSQL Cloud)  
**Status:** In Review / Ready for Implementation  

---

## 1. Executive Summary & Objective

**Market Research** is a fast, mobile-first Progressive Web Application (PWA) designed for on-the-ground field sales and market research (e.g., selling cats/kittens, pets, or high-value physical products at markets, fairs, and customer visits) backed by **Supabase (PostgreSQL)** and hosted **100% free on Vercel**.

### Core Architecture & Guiding Principles
1. **Cloud Database via Supabase (PostgreSQL):**
   - **Central Persistent Cloud Storage:** No local-first sync or CRDT complexity. All data is saved directly to a cloud PostgreSQL database managed by Supabase.
   - **100% Free Hosting:** Supabase offers a generous free tier (500MB database, 50k MAU) and Vercel hosts the frontend PWA for free.
   - **Visual Dashboard:** The user can view, edit, and export customer questions, offers, and visit history directly on supabase.com like a live spreadsheet.
   - **Instant Testing Support:** Includes a built-in mock/demo fallback when Supabase credentials are not yet configured, allowing immediate local development.
2. **Real-Time Online/Offline Detection & Full-Screen Overlay:**
   - Active network monitoring (`navigator.onLine`, browser network events, and continuous Supabase health pings).
   - When offline, a full-screen `z-[9999]` blocking overlay shields the UI to prevent unconfirmed writes.
   - Live auto-reconnection loop and immediate overlay dismissal upon connection restoration.
3. **Mobile Ergonomics & Fast Touch Cards:**
   - Thumb-friendly bottom navigation, minimum 48px tap targets.
   - One-tap quick question chips (*"Vaccinated?"*, *"Age?"*, *"Diet / Food?"*, *"Litter trained?"*, *"Pedigree?"*).
   - Rapid price offer logger with quick preset buttons ($200, $300, $400, $500, etc.) and `+$25`/`+$50` steppers.
   - Safe 2-step confirmation modal for marking items as **Sold**.

---

## 2. Key Feature Specifications

### 2.1. Mobile-First PWA Shell
- Standalone app mode, mobile web manifest, splash icon, theme color (`#059669`), full viewport height handling (`100dvh`), and tactile haptic feedback (`navigator.vibrate([10])`).

### 2.2. Real-Time Online/Offline Detection & Full-Screen Shield
- Continuous connectivity monitoring (browser events + active Supabase ping).
- Full-screen animated blocking overlay (`z-[9999]`) showing network pulse animation, auto-reconnect countdown, and manual "Retry Connection" button.
- Dismisses instantly when connectivity to Supabase is restored.

### 2.3. Product Management & Icon Selection
- Product fields: `name`, `breed_or_type`, `target_price`, `min_acceptable_price`, `icon_type`, `icon_value`, `status` (`AVAILABLE`, `RESERVED`, `SOLD`), `sold_price`, `sold_at`, `notes`.
- Curated avatar/icon picker (cat avatars, paws, accessories) or custom image URLs.

### 2.4. Date-Based Market Research Visits
- Group research sessions and sales inquiries by date and location (e.g., *"Nov 22 - Weekend Pet Expo"*).
- View visit history and compare customer interest and offer levels across dates.

### 2.5. Fast Customer Interaction Logging
- One-tap chips for frequent customer questions.
- Quick offer stepper (`+$10`, `+$25`, `+$50`, `+$100`, preset amounts).
- Customer sentiment tagging (`HIGH_INTEREST`, `CASUAL`, `BARGAIN_HUNTER`, `READY_TO_BUY`).
- Safe "Mark as Sold" dialog with final agreed price and buyer note.

### 2.6. Market Research Insights
- Average, minimum, and maximum offer comparison vs. target price.
- Top questions asked ranking.
- Conversion rate and visit timeline.

---

## 3. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Hosting** | Vercel (Hobby Free Tier) | Zero-cost global CDN static PWA hosting. |
| **Database** | Supabase (PostgreSQL Free Tier) | 500MB cloud database, REST API, visual web dashboard. |
| **Frontend Framework** | React 18 + TypeScript + Vite | Ultra-fast HMR, component modularity, strict typing. |
| **Styling & UI** | Tailwind CSS + Lucide React | High-contrast touch UI, mobile-first design. |
| **PWA Capabilities** | `vite-plugin-pwa` (Workbox) | Offline app shell caching, mobile install prompt, manifest. |
| **Client SDK** | `@supabase/supabase-js` | Typed Supabase client with error handling. |
