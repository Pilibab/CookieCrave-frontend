# CookieCrave Frontend — Security, Performance & Code Quality Audit

> **Audit Date:** August 2026  
> **Verdict:** 4/10 — Runs in dev, **not shippable** to production.

---

## 🔴 Critical — Must Fix Before Any Deployment

### 1. Missing Server-Side Authentication on Backend Endpoints
**Location:** Backend (referenced in `CRITICAL_ISSUES.md`)  
**Impact:** Full data exposure & unauthorized mutations

All backend routes except `/customers` and `/admin` lack authentication guards. Attackers can:
- `GET /api/orders` → view all customer PII & order history
- `PUT /api/orders/{id}` → change status, amounts, cancel orders
- `DELETE` any resource (products, inventory, riders, etc.)

The frontend middleware (`src/middleware.ts:26`) only checks cookie *existence* — trivially spoofable. **The backend is the real gate and it's wide open.**

**Fix:** Add `Depends(get_current_user)` to every router via router-level `dependencies=[...]`.

---

### 2. Server Trusts Client on Order Creation
**Location:** `backend/app/api/endpoints/orders.py:18-24`, `backend/app/service/order_service.py:93-96`  
**Impact:** Payment bypass, impersonation

Backend accepts `cust_id` and `total_amount` directly from request body. Consequences:
- Any authenticated user can place orders as **any other customer** (UUID enumeration)
- Any user can set `total_amount: 0.01` → effectively free orders

**Fix:** Derive `cust_id` from JWT `sub` claim server-side; compute `total_amount` from cart items × product prices.

---

### 3. Double Inventory Deduction & Negative Stock Risk
**Location:** `src/app/orders/page.tsx:88` & `:101`, `backend/app/service/supply_chain_service.py:20`  
**Impact:** Inventory corruption, overselling

- Frontend calls `inventoryApi.deductByOrder(orderId)` **twice** on `Completed` transition (lines 88 & 101)
- Backend `update_inventory` is non-idempotent — each call deducts again
- No stock sufficiency check, no floor at zero

**Fix:** Make deduction idempotent (track deduction status server-side), validate stock before deducting, prevent negative values.

---

### 4. JWT Access Tokens Printed to Server Logs
**Location:** `backend/app/api/deps.py:32`, `:49`  
**Impact:** Token leakage in logs → session hijacking

```python
print(token)        # line 32
print(payload)      # line 49
```

**Fix:** Remove both lines. Use structured logging without secrets.

---

### 5. Admin Guard Broken — Admins Redirected to Login
**Location:** `src/components/layout/AdminGuard.tsx:6`, `:9`  
**Impact:** Admin panel inaccessible

```typescript
import { IS_MOCK } from "@/lib/api";  // ❌ IS_MOCK not exported
const { user, loading, isAdmin } = useAuth();  // ❌ isAdmin not in context
```

TypeScript errors prevent `next build` from passing. The guard redirects admins to `/auth/login`.

**Fix:** Export `IS_MOCK` from `api.ts`, add `isAdmin` to `AuthContextValue` in `useAuth.tsx`.

---

### 6. Frontend/Backend Contract Drift (Silent Bugs)
**Location:** `src/lib/adapters/dashboard.adapter.ts:26`, `src/app/orders/page.tsx:44-48`  
**Impact:** Wrong data shown, validation bypassed

| Issue | Location | Effect |
|-------|----------|--------|
| Reads `raw.ord_pay_meth` | `dashboard.adapter.ts:26` | Settlement column always "Cash" (backend returns `payment_method`) |
| Reads `(order as any).prod_ids` | `orders/page.tsx:44-48` | BOM validation **silently passes** — backend never returns `prod_ids` |

19 `as any` casts hide these mismatches. TypeScript won't catch drift.

**Fix:** Align `src/types/` with backend Pydantic models. Remove all `as any`. Enable strict typechecking in CI.

---

### 7. Order Creation Not Transactional
**Location:** `backend/app/service/order_service.py:125-129`  
**Impact:** Orphaned records, inconsistent state

If GCash insert fails after fulfillment + order + cart lines inserted → partial data committed.

**Fix:** Wrap in Postgres transaction / single RPC function that rolls back on any failure.

---

### <s>8. Supabase Admin Key Exposed in `.env` (Committed to Repo)</s>
<!-- done -->
**Location:** `.env` (lines 8, 15)  
**Impact:** Full database compromise

```env
NEXT_PUBLIC_SUPABASE_ADMIN_KEY=sb_secret_ez2CfY-MR0qm3LV2D7-J4Q_JNex2nyh
SUPABASE_KEY_ADMIN=sb_secret_ez2CfY-MR0qm3LV2D7-J4Q_JNex2nyh
```

The `NEXT_PUBLIC_` prefix **exposes this to the browser**. Admin key = full DB access (bypass RLS).

**Fix:** 
1. Rotate keys immediately in Supabase dashboard
2. Remove `NEXT_PUBLIC_` from admin key
3. Add `.env` to `.gitignore` (already done but key already leaked)
4. Never commit secrets

---

### 9. Auth Cookie Written Without Security Flags
**Location:** `src/app/auth/callback-loading/page.tsx:26`  
**Impact:** Token theft via XSS, MITM

```typescript
document.cookie = `sb-access-token=${token}; path=/; max-age=3600; SameSite=Lax`;
// Missing: Secure, HttpOnly
```

- No `Secure` → sent over HTTP (dev) or stolen via MITM
- No `HttpOnly` → accessible to XSS
- Manual cookie handling bypasses `@supabase/ssr` secure defaults

**Fix:** Use `@supabase/ssr` cookie handling (`createServerClient`/`createBrowserClient`) exclusively.

---

### 10. Logout Endpoint Doesn't Exist on Backend
**Location:** `src/lib/api.ts:117-120`, `src/hooks/useAuth.tsx:57-67`  
**Impact:** Logout always fails (404), session persists

```typescript
// Frontend calls:
POST /auth/logout  // 404 — not implemented on backend
```

**Fix:** Implement `POST /auth/logout` on backend (revoke session, clear cookie) or remove the call.

---

## 🟠 High — Fix Before Production

### 11. Client-Side Pagination + N+1 Request Storm
**Location:** `src/lib/adapters/dashboard.adapter.ts:97-116`  
**Impact:** O(n) latency, bandwidth waste, crashes on large datasets

```typescript
const raw = await ordersApi.list();  // Fetches ALL orders
const filteredRaw = ...filter...
const adaptedOrders = filteredRaw.map(adaptOrder);  // No pagination
return { data: adaptedOrders.slice(start, start + limit) };
```

- Fetches entire orders table, slices in memory
- `fetchAndAdaptOrder` (dead code) would fire 3+ requests per order + 1 per cart item (N+1)

**Fix:** Implement `limit`/`offset` on `GET /api/orders`. Hydrate customer/fulfillment/cart server-side.

---

### 12. `next build` / `tsc --noEmit` Currently Failing
**Location:** Multiple files  
**Impact:** Cannot deploy to Vercel/Netlify, no type safety

| File | Error |
|------|-------|
| `src/app/reports/page.tsx:285` | `dropShadow` not valid in `CSSProperties` |
| `src/app/reports/page.tsx:439` | `marginHeight` invalid (meant `marginRight`) |
| `src/components/layout/AdminGuard.tsx:6` | `IS_MOCK` not exported from `@/lib/api` |
| `src/components/layout/AdminGuard.tsx:9` | `isAdmin` missing from `AuthContextValue` |

Also: `npm run lint` broken — `next lint` removed in Next.js 15.

**Fix:** Fix all TypeScript errors. Update lint script to use `eslint` directly.

---

### <s>13. Duplicate Customer-Facing UIs (Dead Code)</s>
**Date fixed:** `9:51 PM Tuesday, September 1, 2026 (GMT+8)`
**commit hash (fixed at):** `fbee46f549964c399e416e4428415336d15d4351`
**Location:** `src/app/home-customer/` vs `src/app/customer-ui/`  
**Impact:** Maintenance burden, confusion, larger bundle

Two near-identical implementations (`home-customer` and `customer-ui`). Auth callback only routes to `/customer-ui` — `home-customer` is dead weight.

**Fix:** Delete `src/app/home-customer/`.

---

### 14. `requirements.txt` Is a `pip freeze` Dump (Backend)
**Location:** `backend/requirements.txt`  
**Impact:** Supply chain risk, bloated images, version conflicts

Contains: `ipython`, `jupyter`, `nbconvert`, `pyiceberg`, `pipreqs`, etc.

**Fix:** List only runtime dependencies: `fastapi`, `uvicorn`, `supabase`, `pydantic`, `pydantic-settings`, `PyJWT`, `python-multipart`, `httpx`, etc.

---

### 15. No Tests, No CI, No Error Boundaries
**Impact:** Zero regression protection, silent failures in production

- Zero test files (frontend or backend)
- No GitHub Actions workflow
- `alert()` used for error handling (`orders/page.tsx:81`)
- No React error boundaries — single component crash = white screen

**Fix (minimum):** 
- Add smoke tests for `create_order` + `update_inventory`
- Add CI: `tsc --noEmit` + backend compile + tests
- Add error boundaries per route

---

## 🟡 Medium — Technical Debt & Maintainability

### 16. Inline Styles Everywhere (No Design System)
**Location:** All pages (`dashboard/page.tsx`, `products/page.tsx`, `orders/page.tsx`, `inventory/page.tsx`)  
**Impact:** Inconsistent UI, hard to theme, large bundle, no SSR caching

~2000+ lines of inline `React.CSSProperties` objects duplicated across pages. No shared design tokens.

**Fix:** Extract to Tailwind config or CSS modules. Create reusable component library.

---

### 17. Massive Component Files (Single-File Components)
**Location:** `src/app/products/page.tsx` (569 lines), `src/app/dashboard/page.tsx` (494 lines)  
**Impact:** Unmaintainable, hard to test, slow IDE

Each page contains: modal forms, data fetching, rendering, styles — all in one file.

**Fix:** Split into:
- `components/products/ProductCard.tsx`
- `components/products/ProductForm.tsx`
- `components/products/BOMForm.tsx`
- `hooks/useProducts.ts`

---

### 18. Mock Data Mixed with Production Code
**Location:** `src/lib/api.ts:37`, `src/lib/mockdata.ts`  
**Impact:** Accidental mock usage in prod, larger bundle

```typescript
const USE_MOCK = process.env.NEXT_PUBLIC_MOCK === "true";
export const IS_MOCK = USE_MOCK;
```

`NEXT_PUBLIC_MOCK=TRUE` in `.env` — mock data ships to production.

**Fix:** Move mocks to `src/lib/mock/` only imported in tests/storybook. Use MSW for API mocking.

---

### 19. Manual Cookie Parsing (Fragile, Insecure)
**Location:** `src/lib/api.ts:53-58`, `src/hooks/useAuth.tsx:21-27`  
**Impact:** Breaks on cookie format changes, no HttpOnly support

```typescript
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};
```

Duplicate implementation in two files. Doesn't handle `HttpOnly` cookies.

**Fix:** Use `@supabase/ssr` `getToken()` or standard `cookies().get()`.

---

### 20. `supabase` Package Installed But Unused
**Location:** `package.json:18`  
**Impact:** Unnecessary dependency, larger `node_modules`

```json
"supabase": "^2.101.0"  // CLI tool, not a runtime lib
```

Only `@supabase/supabase-js` and `@supabase/ssr` are used.

**Fix:** Remove `supabase` from dependencies.

---

### 21. Hardcoded Localhost URLs in Auth Flow
**Location:** `src/app/auth/login/page.tsx:11`  
**Impact:** Breaks in non-local environments

```typescript
redirectTo: 'http://localhost:3000/auth/callback-loading'
```

**Fix:** Use `process.env.NEXT_PUBLIC_API_FRONTEND_URL` or `window.location.origin`.

---

### 22. Console Logs / Debug Code in Production Paths
**Location:** `src/app/auth/callback-loading/page.tsx:30-43`, `src/lib/api.ts:98`  
**Impact:** PII in logs, performance noise

```typescript
console.log("Role received:", data.user.role);
console.log("Redirecting to:", ...);
console.error("🚨 API failure on ${path}:", errorMessage);
```

**Fix:** Remove or gate behind `process.env.NODE_ENV === "development"`.

---

### 23. Type Imports From Two Different Sources
**Location:** `src/lib/api.ts:19` vs `src/lib/adapters/dashboard.adapter.ts:5-9`  
**Impact:** Type drift, confusion

```typescript
// api.ts
import type { User, Customer, Product... } from "@/types";

// dashboard.adapter.ts
import type { Order as BackendOrder... } from "@/types/mytypes";
```

Two type barrels (`index.ts` and `mytypes.ts`) with overlapping but different definitions.

**Fix:** Single source of truth. Delete `mytypes.ts` or consolidate.

---

### 24. Image Optimization Not Used for Static Assets
**Location:** `src/app/home-customer/page.tsx:51-54`, `AdminNavbar.tsx:26-33`  
**Impact:** Unoptimized images, larger bandwidth

```tsx
// Raw <img> or CSS background-image
backgroundImage: "url('/images/frontImage.jpg')"
// vs Next.js Image component
<Image src="/CKWebLogo.png" ... priority />
```

**Fix:** Use `<Image />` for all static images. Configure `next.config.ts` `images.remotePatterns` for Supabase storage.

---

### 25. No Request Deduplication / Caching
**Location:** `src/hooks/useFetch.ts`  
**Impact:** Duplicate requests on mount, wasted bandwidth

```typescript
useEffect(() => { load(); }, [load]);
```

Every component mounting with same `fetcher` fires independent request. No SWR/React Query caching.

**Fix:** Migrate to `@tanstack/react-query` or SWR for deduplication, caching, retries.

---

### 26. Inline Event Handlers Creating New Functions on Render
**Location:** `products/page.tsx:157-158`, `inventory/page.tsx:298`  
**Impact:** Unnecessary re-renders, GC pressure

```tsx
onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; ... }}
onChange={(e) => setDisplayUnits({ ...displayUnits, [item.inv_id]: e.target.value as UnitType })}
```

New function created every render → breaks `React.memo`, triggers child re-renders.

**Fix:** Use `useCallback` or define handlers outside render.

---

### 27. `suppressHydrationWarning` on `<html>` (Hides Real Issues)
**Location:** `src/app/layout.tsx:16`  
**Impact:** Masks hydration mismatches

```tsx
<html lang="en" suppressHydrationWarning>
```

Used to silence mismatch from browser extensions / SSR differences. Hides real bugs.

**Fix:** Fix the actual hydration mismatch (usually theme/style injection). Remove suppress.

---

### 28. Error Handling Uses `alert()` (No UX, No Logging)
**Location:** `src/app/orders/page.tsx:81`, `products/page.tsx:264`, `inventory/page.tsx:73`  
**Impact:** Poor UX, errors not tracked, blocks automation

```typescript
alert(`Cannot move to "${nextStatus}" — ...`);
alert(`Failed to save product:\n${msg}`);
```

**Fix:** Toast/notification system + error boundary + Sentry/LogRocket integration.

---

### 29. No Input Validation / Sanitization on Forms
**Location:** All form modals (`ProductForm`, `BOMForm`, `InventoryForm`, `CustomerForm`)  
**Impact:** XSS, injection, bad data in DB

No client-side validation (HTML5 only). No server-side validation visible in frontend types.

**Fix:** Add Zod schemas for all forms. Validate on submit. Sanitize HTML inputs.

---

### 30. Hardcoded Status Strings (Magic Strings)
**Location:** `src/app/orders/page.tsx:10-18`, `dashboard/page.tsx:9-17`  
**Impact:** Typos silent, refactoring breaks things

```typescript
const STATUS_OPTIONS: OrderStatus[] = [
  "Pending", "Confirmed", "Baking", "Out for Delivery", ...
];
```

Duplicated in multiple files. Not derived from backend enum.

**Fix:** Centralize in `src/constants/status.ts`. Import everywhere.

---

### 31. `useFetch` Hook Has No AbortController Support
**Location:** `src/hooks/useFetch.ts:14-25`  
**Impact:** State updates on unmounted components, race conditions

```typescript
const load = useCallback(async () => {
  setLoading(true);
  const result = await fetcher();  // No abort signal
  setData(result);
}, deps);
```

If component unmounts before fetch completes → `setData` on unmounted component.

**Fix:** Pass `AbortSignal` to fetcher. Clean up in `useEffect` return.

---

### 32. `fetchAndAdaptOrder` Dead Code (Confusing)
**Location:** `src/lib/adapters/dashboard.adapter.ts:38-62`  
**Impact:** Misleads maintainers, dead code rot

Function defined, exported nowhere, never called. Would cause N+1 if used.

**Fix:** Delete or implement properly with batching.

---

### 33. Inconsistent Naming Conventions
**Location:** Throughout codebase  
**Impact:** Cognitive load, bugs from confusion

| Pattern | Example |
|---------|---------|
| `ord_id` vs `order_id` | Backend vs frontend |
| `cust_id` vs `customer_id` | Backend vs frontend |
| `inv_ing_name` vs `ingredients_name` | Backend vs adapter |
| `prod_id` vs `product_id` | Mixed |

**Fix:** Adopt single convention (prefer frontend camelCase). Use adapters at boundary.

---

### 34. No Accessibility (a11y) Considerations
**Location:** All interactive components  
**Impact:** Legal risk, unusable for disabled users

- No `aria-labels` on icon-only buttons (`✕` close buttons)
- No focus management in modals
- No semantic HTML (`<div>` instead of `<button>` for actions)
- Color-only status indicators (badges)

**Fix:** Audit with axe-core. Add ARIA, focus trap, semantic elements.

---

### 35. No Content Security Policy (CSP)
**Location:** `next.config.ts` (missing)  
**Impact:** XSS attack surface

No `Content-Security-Policy` header configured. Inline styles (`style={...}`) require `'unsafe-inline'`.

**Fix:** Add CSP header. Move inline styles to CSS files to allow strict CSP.

---

### 36. Large Images in `/public` Unoptimized
**Location:** `public/images/*.jpg`, `public/*.png`  
**Impact:** Slow page loads, high bandwidth

| File | Size (est.) |
|------|-------------|
| `HeroBanner.jpg` | ~500KB+ |
| `frontImage.jpg` | ~500KB+ |
| `dashboard-bg.png` | ~300KB+ |

No WebP/AVIF, no responsive sizes.

**Fix:** Run through `next/image` optimizer or pre-compress with `sharp`/`imagemin`. Use `next.config.ts` image optimization.

---

### 37. `tailwindcss` v4 Config but No Content Paths
**Location:** `tailwind.config.ts` (not shown but implied)  
**Impact:** Tailwind purges all styles in production

v4 requires explicit `content` config. Missing → all utility classes purged.

**Fix:** Add `content: ["./src/**/*.{ts,tsx}"]` to config.

---

### 38. No Bundle Analysis / Performance Monitoring
**Impact:** Unknown bundle size, no regression detection

**Fix:** Add `@next/bundle-analyzer`. Track LCP, CLS, TTI in CI.

---

## 🟢 Low — Nice to Have

### 39. Commented-Out Code Blocks
**Location:** `src/app/page.tsx:6-37`, `backend/app/api/auth.py:94-155`  
**Fix:** Delete. Use git history.

### 40. Emoji/Unprofessional Comments
**Location:** `src/lib/api.ts:98` (`🚨`), `src/app/auth/login/page.tsx:47` (`! POTA HHAHAHHAHA`)  
**Fix:** Remove.

### 41. Confused Backend Comments
**Location:** `backend/app/config.py:11`, `backend/app/api/deps.py:16`  
**Fix:** Clean up.

---

## 📋 Summary: Priority Order

| Priority | Issues | Est. Effort |
|----------|--------|-------------|
| **P0 (Blockers)** | #1–#10 | 1–2 weeks |
| **P1 (High)** | #11–#15 | 1 week |
| **P2 (Medium)** | #16–#38 | 2–3 weeks |
| **P3 (Low)** | #39–#41 | 1 day |

---

## 🛠 Recommended Tooling Additions

```bash
# Type safety
npm i -D @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Testing
npm i -D vitest @testing-library/react @testing-library/jest-dom playwright

# CI
# .github/workflows/ci.yml → tsc --noEmit, lint, test, build

# Error tracking
npm i @sentry/nextjs

# API mocking (dev)
npm i -D msw

# Bundle analysis
npm i -D @next/bundle-analyzer
```

---

## 🔐 Immediate Action Required

1. **Rotate Supabase keys** (admin key exposed in `.env`)
2. **Fix AdminGuard** (build broken, admin locked out)
3. **Add backend auth** to all routers
4. **Fix double inventory deduction**
5. **Remove `console.log` of tokens**

These 5 items are **security/availability blockers**. Do not deploy until resolved.