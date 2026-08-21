# Critical Issues

Wellness check of the CookieKrave project (Aug 2026). Overall verdict: **4/10 — runs in dev, not shippable.**

Everything below is scoped to code outside Supabase data-access (those were excluded from the review).

---

## 🔴 Critical — fix first

### 1. Most endpoints are unauthenticated

Orders, products, inventory, cart, BOM, fulfillment, riders, and reports routers have **zero** auth dependencies. Only `customers` and `admin` are guarded:

- `backend/app/api/endpoints/customer.py:52-94` — only route with guards
- `backend/app/api/endpoints/admin.py:13` — uses `require_admin`

Anyone can hit the API directly and:
- `GET /api/orders` — view every customer's order data
- `PUT /api/orders/{id}` — change status or amounts of any order
- `DELETE` on any resource

`frontend/src/middleware.ts:26` only checks that the cookie *exists* (trivially spoofable). The backend is the only real gate and it is open.

**Fix:** add `Depends(get_current_user)` (or `require_admin`) to every router — preferably router-level `dependencies=[...]` so new endpoints are protected by default.

### 2. Server trusts the client on order creation

`backend/app/api/endpoints/orders.py:18-24` accepts `cust_id` and `total_amount` from the request body, and `backend/app/service/order_service.py:93-96` uses them as-is.

Consequences:
- Any user can place an order as any other customer
- Any user can set `total_amount` to ₱0.01

**Fix:** derive `cust_id` from the JWT `sub` claim server-side; compute `total_amount` from cart items + product prices, never from the client.

### 3. Inventory is deducted twice and can go negative

- `frontend/src/app/orders/page.tsx:88` and `:101` both call `inventoryApi.deductByOrder(orderId)` on a `Completed` transition → **double deduction**
- `backend/app/service/supply_chain_service.py:20` (`update_inventory`) is non-idempotent — every call deducts again
- No check that stock is sufficient, no floor at zero

**Fix:** make deduction idempotent (e.g., only deduct on a specific status transition, once, tracked server-side), check stock before deducting, and prevent negative stock.

### 4. JWT tokens printed to console on every request

- `backend/app/api/deps.py:32` — `print(token)`
- `backend/app/api/deps.py:49` — `print(payload)`

These leak access tokens into server logs.

**Fix:** delete both prints (or use proper structured logging without secrets).

---

## 🟠 High

### 5. `next build` is broken right now

`tsc --noEmit` fails with 4 errors:

| File | Error |
|---|---|
| `frontend/src/app/reports/page.tsx:285` | `dropShadow` not valid in CSSProperties |
| `frontend/src/app/reports/page.tsx:439` | `marginHeight` not valid (meant `marginRight`) |
| `frontend/src/components/layout/AdminGuard.tsx:6` | `IS_MOCK` is not exported from `@/lib/api` |
| `frontend/src/components/layout/AdminGuard.tsx:9` | `isAdmin` does not exist on `AuthContextValue` |

The AdminGuard bugs are functional, not cosmetic: `isAdmin` is `undefined`, so the guard **redirects admins back to login**.

Also: `npm run lint` is broken — `next lint` was removed in Next.js 15.

**Fix:** typecheck/lint before every commit. Either fix AdminGuard (`IS_MOCK` doesn't exist in `frontend/src/lib/api.ts`; add `isAdmin` to `frontend/src/hooks/useAuth.tsx`'s context) or delete it.

### 6. Frontend/backend contract drift

Backend renamed `ord_pay_meth` → `payment_method` and returns `ord_id`/`cust_id`, but:

- `frontend/src/lib/adapters/dashboard.adapter.ts:26` still reads `raw.ord_pay_meth` → Settlement column always shows "Cash"
- `frontend/src/app/orders/page.tsx:44-48` `validateBOM` reads `(order as any).prod_ids` which the backend never returns → BOM validation **silently always passes**

There are 19 `as any` casts hiding these mismatches.

**Fix:** keep one source of truth for the Order shape (align `frontend/src/types/` with backend Pydantic models), remove `as any` casts, and typecheck so drift fails the build.

### 7. Order creation isn't transactional

`backend/app/service/order_service.py:125-129` swallows the exception and returns a 400. If the GCash insert fails after the fulfillment + order rows were already inserted, you're left with orphaned records.

**Fix:** use a Postgres transaction / RPC (single function that inserts fulfillment, order, cart lines, and payment) so a failure rolls everything back.

### 8. Client-side pagination + N+1 requests

`frontend/src/lib/adapters/dashboard.adapter.ts:97-116` (`fetchPendingOrders`) fetches ALL orders and slices client-side — no backend pagination.

`fetchAndAdaptOrder` (lines 38-62) is dead code and would fire ~3+ requests per order + 1 per cart item (N+1).

**Fix:** implement `limit`/`offset` on `GET /api/orders` and hydrate customer/fulfillment/cart server-side (or accept the N+1 deliberately with a comment).

---

## 🟡 Medium

### 9. Two identical customer UIs

`frontend/src/app/home-customer/` and `frontend/src/app/customer-ui/` are copy-paste duplicates (about-us, contact, order, order-track, page, layout — customer-ui has an extra `profile/`).

The auth callback only routes to `/customer-ui` (`frontend/src/app/auth/callback-loading/page.tsx:31,39`), so `home-customer` is dead weight.

**Fix:** delete `home-customer/`.

### 10. `requirements.txt` is a `pip freeze` dump

Contains ipython, jupyter, nbconvert, pyiceberg, pipreqs, etc. (`backend/requirements.txt`).

**Fix:** list only the packages you actually import (fastapi, uvicorn, supabase, pydantic, pydantic-settings, PyJWT, nameparser, python-multipart, httpx...).

### 11. No tests, no CI, no error boundaries

Zero test files on either side, no CI pipeline, and `alert()` is used for error handling (`frontend/src/app/orders/page.tsx:81`).

**Fix (minimal):** at minimum add smoke tests for `create_order` + `update_inventory`, and a GitHub Actions workflow running `tsc --noEmit` + backend compile/tests.

### 12. Dead code and debug leftovers

- ~60 lines of commented-out legacy code in `backend/app/api/auth.py:94-155`
- Commented-out blocks in `frontend/src/app/page.tsx`
- Emoji `console.error` in `frontend/src/lib/api.ts:52`
- Confused comments: `backend/app/config.py:11` (`# ? why tf fo i need default=none here???`), `backend/app/api/deps.py:16`
- Logged-out `console.log` calls in `frontend/src/app/auth/callback-loading/page.tsx:30-43`

**Fix:** delete, don't comment out.

### 13. Auth cookie hygiene

`frontend/src/app/auth/callback-loading/page.tsx:26` writes the access token to a plain `document.cookie` with `max-age=3600`, no `Secure`, no `HttpOnly`.

`authApi.logout()` (`frontend/src/lib/api.ts:61`) hits `/api/auth/logout`, which **doesn't exist on the backend** — logout always 404s (`frontend/src/hooks/useAuth.tsx:57-67`).

**Fix:** implement `POST /auth/logout` on the backend (or remove the call), and use `@supabase/ssr` cookie handling instead of manual `document.cookie` writes.

---

## ✅ Not broken (leave as is)

- `.env` is gitignored and untracked — secrets are not committed
- Backend compiles clean (42 files)
- Layering is sound: repo → service → endpoint
- DB schema is versioned in `backend/app/db/*.sql`

---

## Suggested 2-week plan

| Week | Focus |
|---|---|
| 1 | #1 auth on all routers, #2 server-side order totals, #4 remove token prints, #5 fix build (AdminGuard + tsc errors) |
| 2 | #3 idempotent stock deduction, #6 contract drift, #7 transactional order creation, then #9-#13 cleanup + a few smoke tests |

Anything in 🔴 is a blocker for showing this in a portfolio as-is; 🟠 should be fixed before it's "portfolio ready"; 🟡 is cleanup.
