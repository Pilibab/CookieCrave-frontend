// lib/api.ts
// Central API client — update BASE_URL to match your backend

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // send session cookies
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "API Error");
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  me: () => request<{ user: import("@/types").User }>("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  // Google OAuth redirect is handled by backend:
  // GET /api/auth/google → redirects to Google
  // GET /api/auth/google/callback → sets session, redirects to /dashboard
  googleLoginUrl: `${BASE_URL}/auth/google`,
};

// ─── Customers ────────────────────────────────────────────────────────────────
export const customersApi = {
  list: (page = 1, limit = 20) =>
    request<import("@/types").PaginatedResponse<import("@/types").Customer>>(
      `/customers?page=${page}&limit=${limit}`
    ),
  get: (id: number) =>
    request<import("@/types").Customer>(`/customers/${id}`),
  create: (body: Partial<import("@/types").Customer>) =>
    request<import("@/types").Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: number, body: Partial<import("@/types").Customer>) =>
    request<import("@/types").Customer>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  list: () =>
    request<import("@/types").Product[]>("/products"),
  get: (id: number) =>
    request<import("@/types").Product>(`/products/${id}`),
  create: (body: Partial<import("@/types").Product>) =>
    request<import("@/types").Product>("/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: number, body: Partial<import("@/types").Product>) =>
    request<import("@/types").Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  getBOM: (id: number) =>
    request<import("@/types").BOMEntry[]>(`/products/${id}/bom`),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  list: (page = 1, limit = 20, status?: string) =>
    request<import("@/types").PaginatedResponse<import("@/types").Order>>(
      `/orders?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`
    ),
  get: (id: number) =>
    request<import("@/types").Order>(`/orders/${id}`),
  create: (body: {
    customer_id: number;
    fulfillment_id: number;
    payment_method: string;
    cart_items: { product_id: number; quantity: number }[];
  }) =>
    request<import("@/types").Order>("/orders", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateStatus: (id: number, status: import("@/types").OrderStatus) =>
    request<import("@/types").Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  list: () =>
    request<import("@/types").InventoryItem[]>("/inventory"),
  get: (id: number) =>
    request<import("@/types").InventoryItem>(`/inventory/${id}`),
  update: (id: number, body: Partial<import("@/types").InventoryItem>) =>
    request<import("@/types").InventoryItem>(`/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  create: (body: Partial<import("@/types").InventoryItem>) =>
    request<import("@/types").InventoryItem>("/inventory", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  lowStock: () =>
    request<import("@/types").LowStockItem[]>("/inventory/low-stock"),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsApi = {
  weeklySummary: (weekStart?: string) =>
    request<import("@/types").WeeklySummary>(
      `/reports/weekly${weekStart ? `?week_start=${weekStart}` : ""}`
    ),
  ordersByStatus: () =>
    request<Record<string, number>>("/reports/orders-by-status"),
};

// ─── Fulfillment ──────────────────────────────────────────────────────────────
export const fulfillmentApi = {
  create: (body: Partial<import("@/types").Fulfillment>) =>
    request<import("@/types").Fulfillment>("/fulfillment", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ─── Riders ───────────────────────────────────────────────────────────────────
export const ridersApi = {
  list: () => request<import("@/types").Rider[]>("/riders"),
};
