# CookieKrave Frontend — Reading Plan

Goal: understand this codebase well enough to fix the critical issues in [`CRITICAL_ISSUES.md`](./CRITICAL_ISSUES.md), starting with your self-assigned task: **make the app fully runnable on mock data** (no backend needed).

Read top-to-bottom. Each phase builds on the previous one. Time estimates assume casual reading with the code open.

---

## How data flows (the 60-second version)

```
Browser page ("use client")
   │  imports
   ▼
src/lib/api.ts ──── request() reads sb-access-token cookie, adds Bearer header
   │                   │
   │ USE_MOCK? ──► src/lib/mockdata.ts        (when NEXT_PUBLIC_MOCK === "true")
   ▼                   │
FastAPI backend @ NEXT_PUBLIC_API_BACKEND_URL (http://localhost:8000/api)

Auth: /auth/login → Supabase Google OAuth → /auth/callback-loading
      → writes token cookie → useAuth() calls GET /auth/me → redirect by role
Guard: src/middleware.ts redirects to /auth/login if no cookie (existence check only!)
```

Two shape systems exist for the same entities:

| File | Style | Example order id field | Used by |
|---|---|---|---|
| `src/types/mytypes.ts` | mirrors backend DB (snake_case) | `ord_id`, `cust_id`, `ord_pay_meth` | raw API responses |
| `src/types/index.ts` | frontend-friendly | `order_id`, `customer_id`, `payment_method` | pages/components |

`src/lib/adapters/dashboard.adapter.ts` translates mytypes → index types. This duplication is the root of issue #6 (contract drift).

---

## Phase 0 — Get oriented & run it (~30 min)

- [ ] Skim [`README.md`](./README.md) (structure table) and [`CRITICAL_ISSUES.md`](./CRITICAL_ISSUES.md) (the punch list you're working from)
- [ ] `npm run dev`, then visit `/auth/login` — note you can't get past login without Google OAuth + backend. That's exactly why your mock task matters.
- [ ] Read `.env`: `NEXT_PUBLIC_MOCK=TRUE` and `NEXT_PUBLIC_API_BACKEND_URL=http://localhost:8000/api`
- [ ] ⚠️ **Gotcha #1:** `.env` says `TRUE` (uppercase) but `src/lib/api.ts:25` compares against `"true"` (lowercase). **Mock mode is currently silently OFF.** First fix of your task: normalize this comparison (e.g. `=== "true"` after `.toLowerCase()`, or fix the env value).
- [ ] Verify build status yourself: `npx tsc --noEmit` — expect the 4 errors from issue #5. Don't fix them yet; just see them.
- [ ] Note: `npm run lint` is dead (`next lint` removed in Next.js 15). Your real gate is `npx tsc --noEmit`.

## Phase 1 — Types: learn the vocabulary (~45 min)

Read both type files side by side. Every later file assumes you know these names.

- [ ] `src/types/index.ts` — the frontend dialect (`Order`, `Product`, `CartOrderLineItem`, `Fulfillment`/`Delivery`/`PickUp`, `WeeklySummary`). Notice `Customer` is defined **twice** in this file (lines ~11 and ~89).
- [ ] `src/types/mytypes.ts` — the backend dialect (`ord_*`, `prod_*`, `inv_*`, `cust_*`). Notice it duplicates almost everything in `index.ts`.
- [ ] Make yourself a cheat-sheet mapping (backend → frontend): `ord_id→order_id`, `cust_id→customer_id`, `prod_price→price`, `inv_stock→current_stock`, `ord_pay_meth→payment_method`. You'll need it constantly.
- [ ] Understand why issue #6 exists: nothing forces these two files to agree, and 19 `as any` casts hide mismatches.

**Checkpoint:** given `{ ord_id: 7, cust_id: "abc", total_amount: 200 }`, can you say which file that belongs to and what its frontend equivalent looks like?

## Phase 2 — Data layer: api.ts, adapters, mockdata (~1–2 h)

This phase IS your mock task's foundation.

- [ ] `src/lib/api.ts` end-to-end (502 lines, but repetitive by design):
  - `request<T>()` (line 30): cookie parsing, Bearer injection, error handling incl. FastAPI 422 arrays
  - The per-resource objects (`customersApi`, `productsApi`, `ordersApi`, `inventoryApi`, `bomApi`, `cartApi`, `fulfillmentApi`, `deliveryApi`, `pickupApi`, `ridersApi`, `adminApi`, `reportsApi`) — skim, don't memorize; each method = one REST call
  - `USE_MOCK` (line 25) — today only `productsApi.list()` (lines 126–138) actually branches on it. **This is the pattern you'll copy everywhere else.**
- [ ] `src/lib/mockdata.ts` — already has a complete fake world: 6 products, 9 inventory items, BOM links, 4 riders, 5 fulfillments, 9 cart lines, 7 orders (one per status!), weekly summary, low-stock list. Your mock task mostly = wiring these into the remaining Api objects.
- [ ] `src/lib/adapters/dashboard.adapter.ts` — read `adaptOrder` (19), `fetchPendingOrders` (92), `adaptInventoryItem` (148). See where client-side filtering/pagination happens (issue #8) and where `raw.ord_pay_meth` breaks Settlement columns (issue #6).
- [ ] `src/hooks/useFetch.ts` — tiny generic hook (`useFetch`, `useMutation`) some pages use instead of calling Api objects directly.

**Mock-task design decision to make here:** keep per-method `if (USE_MOCK)` branches inside each Api object (matches existing style, zero new files) vs. a central mock router. Recommend the former for now.

## Phase 3 — Auth flow (~1 h)

Follow one user through the system:

- [ ] `src/app/auth/login/page.tsx` — button → `supabase.auth.signInWithOAuth({ provider: "google" })`
- [ ] `src/app/auth/callback-loading/page.tsx` — listens for `SIGNED_IN`, writes `sb-access-token` via plain `document.cookie` (issue #13), calls `authApi.me()`, redirects admin→`/dashboard`, customer→`/customer-ui`
- [ ] `src/hooks/useAuth.tsx` — `AuthProvider` wraps the whole app (see `src/app/layout.tsx`); reads the same cookie, calls `/auth/me`, exposes `{ user, loading, logout }`. Note: there is **no `isAdmin`** here yet — AdminGuard expects one.
- [ ] `src/middleware.ts` — edge guard: internal routes (`/dashboard`, `/orders`, ...) require *any* value in the cookie. Spoofable, but fine as UX-level protection; the real gate must be the backend (issue #1).
- [ ] `src/lib/supabase.ts` — client init (uses env keys).

**Checkpoint:** why does `useAuth` skip the `/auth/me` call when no cookie exists, and what happens when the token expires mid-session?

## Phase 4 — Pages (~2–3 h, skim UI details, trace the data)

Admin back-office (all wrapped in `dashboard/layout.tsx` → `AdminNavbar`):

- [ ] `src/app/dashboard/page.tsx` — uses `dashboardApi`/`inventoryDashboardApi` from the adapter (not raw api.ts!) — the only adapter consumer so far
- [ ] `src/app/orders/page.tsx` — the messiest page: double inventory deduction on `Completed` (issue #3, lines ~88/:101), `validateBOM` reading nonexistent `prod_ids` (issue #6, lines 44–48), `alert()` error handling (issue #11)
- [ ] `src/app/orders/[id]/page.tsx` — hydrates an order from 6+ endpoints (ordersApi + customers + fulfillment + delivery/pickup + cart + products)
- [ ] `src/app/orders/new/page.tsx` — builds `CreateOrderBody`; note it sends `cust_id` + `total_amount` from the client (issue #2's frontend half)
- [ ] `src/app/products/page.tsx`, `src/app/inventory/page.tsx`, `src/app/customers/page.tsx`, `src/app/reports/page.tsx` — CRUD tables; reports also holds 2 of the 4 tsc errors (issue #5)
- [ ] `src/components/layout/AdminGuard.tsx` — broken on purpose-by-neglect: imports `IS_MOCK` (api.ts exports `USE_MOCK`, not `IS_MOCK`) and reads `isAdmin` from context (doesn't exist) → admins get bounced to login (issue #5). Fixing this is part of your mock task because its whole point is bypassing auth in mock mode.

Customer storefront:

- [ ] `src/app/customer-ui/*` — the LIVE storefront (auth callback routes here)
- [ ] `src/app/home-customer/*` — copy-paste twin, unreachable → deletion candidate (issue #9). Don't waste time reading it deeply.

## Phase 5 — Execute the mock task (~half a day)

Concrete checklist, in order:

1. [ ] Fix the flag mismatch: make `USE_MOCK` in `api.ts` tolerant (`process.env.NEXT_PUBLIC_MOCK?.toLowerCase() === "true"`) or change `.env` to lowercase
2. [ ] Export it under the name AdminGuard expects: `export const IS_MOCK = USE_MOCK;` in `api.ts`
3. [ ] Add `isAdmin` to `useAuth.tsx`: derive from role (`const isAdmin = user?.role === "admin"`), include in context value — AdminGuard then works in both modes
4. [ ] Extend mock branching using existing `mockdata.ts` exports, copying the `productsApi.list` pattern, in priority order (what blocks the most pages):
   - `ordersApi.list/get/updateStatus/create` (+ in-memory mutations so status changes stick during a session)
   - `inventoryApi.list/adjustStock/deductByOrder/lowStock`
   - `customersApi.list/create/get`
   - `reportsApi.weeklySummary`
   - `cartApi.getByOrder`, `fulfillmentApi.get` (needed if any page hydrates like `[id]/page.tsx`)
   - `authApi.me/logout` — return a fake admin `User` when `IS_MOCK`, so login isn't needed at all
5. [ ] Keep mutations consistent: e.g. `updateStatus` mutates the shared `mockOrders` array so dashboard/orders/detail stay in sync
6. [ ] Sanity pass: `npx tsc --noEmit` clean (or at least no NEW errors), then click through every route with `NEXT_PUBLIC_MOCK=true`

After this, the app runs standalone and you can develop/learn without the backend — while still fixing issues #1–#4 in the backend repo afterward.

---

## Issue → code map (from CRITICAL_ISSUES.md)

| Issue | Files to touch |
|---|---|
| #1 unauthenticated endpoints | backend routers (frontend half: `middleware.ts` weakness) |
| #2 server trusts client totals | `src/app/orders/new/page.tsx`, backend `orders.py` |
| #3 double inventory deduction | `src/app/orders/page.tsx:88,:101` |
| #4 token prints | backend `deps.py` |
| #5 broken build/AdminGuard | `reports/page.tsx:285,:439`, `AdminGuard.tsx:6,:9`, `useAuth.tsx`, `api.ts` |
| #6 contract drift | `types/index.ts` vs `types/mytypes.ts`, `dashboard.adapter.ts`, `orders/page.tsx:44` |
| #7 non-transactional orders | backend |
| #8 N+1 / client pagination | `dashboard.adapter.ts:38-116` |
| #9 duplicate customer UI | delete `src/app/home-customer/` |
| #13 cookie hygiene | `callback-loading/page.tsx:26`, `useAuth.tsx` logout |

## Ground rules while learning

- Never trust a type blindly — check whether the page actually receives `index.ts` shapes or raw `mytypes.ts` shapes.
- `as any` = someone papered over a contract mismatch; treat each one as a bug lead.
- After every change: `npx tsc --noEmit`.
- Don't refactor while you're still confused. Fix, verify, commit small.
