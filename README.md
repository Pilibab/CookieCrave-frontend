# CookieKrave — Frontend

Next.js 15 app for the CookieKrave Order Management System.

## Stack
- **Next.js 15** (App Router)
- **TypeScript**
- **Custom CSS** (no UI library — plain class-based styles in `globals.css`)
- **Google OAuth** (handled by the backend; frontend just redirects to `/api/auth/google`)

## Structure

```
src/
├── app/
│   ├── auth/login/          # Login page (Google sign-in)
│   ├── dashboard/           # Dashboard home (metrics, pending orders, low stock)
│   ├── orders/              # Order list, detail view, new order form
│   │   ├── [id]/            # Order detail + status stepper
│   │   └── new/             # Place a new order
│   ├── products/            # Product CRUD
│   ├── inventory/           # Ingredient stock management
│   ├── customers/           # Customer directory
│   └── reports/             # Weekly profit & order-by-status report
├── components/
│   └── layout/Sidebar.tsx   # Navigation sidebar
├── hooks/
│   ├── useAuth.tsx          # Auth context + hook
│   └── useFetch.ts          # Generic fetch + mutation hooks
├── lib/
│   └── api.ts               # All backend API calls (REST)
├── types/
│   └── index.ts             # TypeScript types mirroring the DB schema
└── middleware.ts             # Route protection (redirect to /auth/login if no session)
```

## Pages & Features

| Page | Path | Features |
|------|------|---------|
| Login | `/auth/login` | Google OAuth button → backend redirect |
| Dashboard | `/dashboard` | Order window status, metric cards, pending orders table, low stock alerts |
| Orders | `/orders` | Filterable list by status, pagination |
| Order Detail | `/orders/[id]` | Status stepper (Pending → Confirmed → Baking → Out for Delivery → For Pickup → Completed → Cancel), customer & fulfillment info, itemized invoice |
| New Order | `/orders/new` | Customer picker, product grid with qty controls, fulfillment (Delivery / Pick Up), payment method, live order summary |
| Products | `/products` | Table with availability toggle, add/edit modal |
| Inventory | `/inventory` | Stock levels with low-stock highlight, add/edit modal |
| Customers | `/customers` | Directory with pagination, add modal |
| Reports | `/reports` | Week picker, revenue + order count cards, status breakdown bar chart, print |

## Setup

```bash
# Install dependencies
npm install

# Copy env and set your backend URL
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Run dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Base URL of the Express backend (default: `http://localhost:3001/api`) |

## Backend Contract (expected API endpoints)

The `src/lib/api.ts` file documents every endpoint the frontend calls.
Key ones the backend must implement:

- `GET  /api/auth/me` — returns `{ user }` from session
- `GET  /api/auth/google` — initiates Google OAuth flow
- `GET  /api/auth/google/callback` — OAuth callback, sets session, redirects to `/dashboard`
- `POST /api/auth/logout` — destroys session
- `GET/POST /api/customers`
- `GET/PUT /api/customers/:id`
- `GET/POST /api/products`
- `GET/PUT /api/products/:id`
- `GET /api/products/:id/bom`
- `GET/POST /api/orders?page&limit&status`
- `GET /api/orders/:id`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`
- `GET/POST /api/inventory`
- `GET/PUT /api/inventory/:id`
- `GET /api/inventory/low-stock`
- `POST /api/fulfillment`
- `GET /api/riders`
- `GET /api/reports/weekly?week_start=YYYY-MM-DD`
- `GET /api/reports/orders-by-status`
