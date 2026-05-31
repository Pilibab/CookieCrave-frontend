// lib.ts
// Set NEXT_PUBLIC_MOCK=true in .env.local to use mock data (no backend needed)

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const IS_MOCK = false;

// ─── Real API ─────────────────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
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
  me: () => IS_MOCK
    ? Promise.resolve({ user: { id: "1", email: "admin@cookiekrave.com", name: "Admin", role: "admin" as const } })
    : request<{ user: import("@/types").User }>("/auth/me"),
  logout: () => IS_MOCK
    ? Promise.resolve()
    : request("/auth/logout", { method: "POST" }),
  googleLoginUrl: `${BASE_URL}/api/auth/google`,
};

// ─── Lazy-load mock APIs only when needed ────────────────────────────────────
import type {
  mockCustomersApi as MockCustomersApi,
  mockProductsApi as MockProductsApi,
  mockOrdersApi as MockOrdersApi,
  mockInventoryApi as MockInventoryApi,
  mockReportsApi as MockReportsApi,
  mockFulfillmentApi as MockFulfillmentApi,
  mockRidersApi as MockRidersApi,
  mockBomApi as MockBomApi,
  mockCartApi as MockCartApi,
  mockDeliveryApi as MockDeliveryApi,
  mockPickupApi as MockPickupApi,
} from "./mockApi";

function getMock() {
  return require("./mockApi") as {
    mockCustomersApi: typeof MockCustomersApi;
    mockProductsApi: typeof MockProductsApi;
    mockOrdersApi: typeof MockOrdersApi;
    mockInventoryApi: typeof MockInventoryApi;
    mockReportsApi: typeof MockReportsApi;
    mockFulfillmentApi: typeof MockFulfillmentApi;
    mockRidersApi: typeof MockRidersApi;
    mockBomApi: typeof MockBomApi;
    mockCartApi: typeof MockCartApi;
    mockDeliveryApi: typeof MockDeliveryApi;
    mockPickupApi: typeof MockPickupApi;
  };
}

// ─── Customers ────────────────────────────────────────────────────────────────
// GET    /api/customers
// POST   /api/customers
// GET    /api/customers/{customer_id}
// PUT    /api/customers/{customer_id}
// DELETE /api/customers/{customer_id}
export const customersApi = {
  list: (page = 1, limit = 20) => IS_MOCK
    ? getMock().mockCustomersApi.list(page, limit)
    : request<import("@/types").PaginatedResponse<import("@/types").Customer>>(`/api/customers?page=${page}&limit=${limit}`),
  get: (id: number) => IS_MOCK
    ? getMock().mockCustomersApi.get(id)
    : request<import("@/types").Customer>(`/customers/${id}`),
  create: (body: Partial<import("@/types").Customer>) => IS_MOCK
    ? getMock().mockCustomersApi.create(body)
    : request<import("@/types").Customer>("/customers", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types").Customer>) => IS_MOCK
    ? getMock().mockCustomersApi.update(id, body)
    : request<import("@/types").Customer>(`/customers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => IS_MOCK
    ? Promise.resolve()
    : request(`/customers/${id}`, { method: "DELETE" }),
};

// ─── Products ─────────────────────────────────────────────────────────────────
// POST   /products
// GET    /products
// GET    /products/{product_id}
// PUT    /products/{product_id}
// DELETE /products/{product_id}
export const productsApi = {
  list: () => IS_MOCK
    ? getMock().mockProductsApi.list()
    : request<import("@/types").Product[]>("/products"),
  get: (id: number) => IS_MOCK
    ? getMock().mockProductsApi.get(id)
    : request<import("@/types").Product>(`/products/${id}`),
  create: (body: Partial<import("@/types").Product>) => IS_MOCK
    ? getMock().mockProductsApi.create(body)
    : request<import("@/types").Product>("/products", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types").Product>) => IS_MOCK
    ? getMock().mockProductsApi.update(id, body)
    : request<import("@/types").Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => IS_MOCK
    ? getMock().mockProductsApi.delete(id)
    : request(`/products/${id}`, { method: "DELETE" }),
};

// ─── BOM (Bill of Materials) ───────────────────────────────────────────────────
// GET    /bom
// POST   /bom
// GET    /bom/{bom_id}
// PUT    /bom/{bom_id}
// DELETE /bom/{bom_id}
// GET    /bom/product/{product_id}      — ingredients for a product
// GET    /bom/ingredient/{inventory_id} — products using an ingredient
export const bomApi = {
  list: () => IS_MOCK
    ? getMock().mockBomApi.list()
    : request<import("@/types").BOMEntry[]>("/bom"),
  get: (id: number) => IS_MOCK
    ? getMock().mockBomApi.get(id)
    : request<import("@/types").BOMEntry>(`/bom/${id}`),
  create: (body: Partial<import("@/types").BOMEntry>) => IS_MOCK
    ? getMock().mockBomApi.create(body)
    : request<import("@/types").BOMEntry>("/bom", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types").BOMEntry>) => IS_MOCK
    ? getMock().mockBomApi.update(id, body)
    : request<import("@/types").BOMEntry>(`/bom/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => IS_MOCK
    ? Promise.resolve()
    : request(`/bom/${id}`, { method: "DELETE" }),
  getByProduct: (productId: number) => IS_MOCK
    ? getMock().mockBomApi.getByProduct(productId)
    : request<import("@/types").BOMEntry[]>(`/bom/product/${productId}`),
  getByIngredient: (inventoryId: number) => IS_MOCK
    ? getMock().mockBomApi.getByIngredient(inventoryId)
    : request<import("@/types").BOMEntry[]>(`/bom/ingredient/${inventoryId}`),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
// GET    /cart
// POST   /cart
// GET    /cart/order/{order_id}
// DELETE /cart/order/{order_id}/product/{product_id}
// POST   /cart/order/{order_id}/bulk
export const cartApi = {
  list: () => IS_MOCK
    ? getMock().mockCartApi.list()
    : request<import("@/types").CartOrderLineItem[]>("/cart"),
  add: (body: { order_id: number; product_id: number; quantity: number }) => IS_MOCK
    ? getMock().mockCartApi.add(body)
    : request<import("@/types").CartOrderLineItem>("/cart", { method: "POST", body: JSON.stringify(body) }),
  getByOrder: (orderId: number) => IS_MOCK
    ? getMock().mockCartApi.getByOrder(orderId)
    : request<import("@/types").CartOrderLineItem[]>(`/cart/order/${orderId}`),
  removeItem: (orderId: number, productId: number) => IS_MOCK
    ? Promise.resolve()
    : request(`/cart/order/${orderId}/product/${productId}`, { method: "DELETE" }),
  bulkAdd: (orderId: number, items: { product_id: number; quantity: number }[]) => IS_MOCK
    ? getMock().mockCartApi.bulkAdd(orderId, items)
    : request<import("@/types").CartOrderLineItem[]>(`/cart/order/${orderId}/bulk`, { method: "POST", body: JSON.stringify(items) }),
};

// ─── Fulfillment ──────────────────────────────────────────────────────────────
// GET    /fulfillment
// POST   /fulfillment
// GET    /fulfillment/{fulfillment_id}
// PUT    /fulfillment/{fulfillment_id}
// DELETE /fulfillment/{fulfillment_id}
export const fulfillmentApi = {
  list: () => IS_MOCK
    ? getMock().mockFulfillmentApi.list()
    : request<import("@/types").Fulfillment[]>("/fulfillment"),
  get: (id: number) => IS_MOCK
    ? getMock().mockFulfillmentApi.get(id)
    : request<import("@/types").Fulfillment>(`/fulfillment/${id}`),
  create: (body: Partial<import("@/types").Fulfillment>) => IS_MOCK
    ? getMock().mockFulfillmentApi.create(body)
    : request<import("@/types").Fulfillment>("/fulfillment", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types").Fulfillment>) => IS_MOCK
    ? getMock().mockFulfillmentApi.update(id, body)
    : request<import("@/types").Fulfillment>(`/fulfillment/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => IS_MOCK
    ? Promise.resolve()
    : request(`/fulfillment/${id}`, { method: "DELETE" }),
};

// ─── Delivery ─────────────────────────────────────────────────────────────────
// GET    /delivery
// POST   /delivery
// GET    /delivery/{fulfillment_id}
// PUT    /delivery/{fulfillment_id}
// DELETE /delivery/{fulfillment_id}
// GET    /delivery/rider/{rider_id}
export const deliveryApi = {
  list: () => IS_MOCK
    ? getMock().mockDeliveryApi.list()
    : request<import("@/types").Delivery[]>("/delivery"),
  get: (fulfillmentId: number) => IS_MOCK
    ? getMock().mockDeliveryApi.get(fulfillmentId)
    : request<import("@/types").Delivery>(`/delivery/${fulfillmentId}`),
  create: (body: Partial<import("@/types").Delivery>) => IS_MOCK
    ? getMock().mockDeliveryApi.create(body)
    : request<import("@/types").Delivery>("/delivery", { method: "POST", body: JSON.stringify(body) }),
  update: (fulfillmentId: number, body: Partial<import("@/types").Delivery>) => IS_MOCK
    ? getMock().mockDeliveryApi.update(fulfillmentId, body)
    : request<import("@/types").Delivery>(`/delivery/${fulfillmentId}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (fulfillmentId: number) => IS_MOCK
    ? Promise.resolve()
    : request(`/delivery/${fulfillmentId}`, { method: "DELETE" }),
  getByRider: (riderId: number) => IS_MOCK
    ? getMock().mockDeliveryApi.getByRider(riderId)
    : request<import("@/types").Delivery[]>(`/delivery/rider/${riderId}`),
};

// ─── Pickup ───────────────────────────────────────────────────────────────────
// GET    /pickup
// POST   /pickup
// GET    /pickup/{fulfillment_id}
// PUT    /pickup/{fulfillment_id}
// DELETE /pickup/{fulfillment_id}
export const pickupApi = {
  list: () => IS_MOCK
    ? getMock().mockPickupApi.list()
    : request<import("@/types").PickUp[]>("/pickup"),
  get: (fulfillmentId: number) => IS_MOCK
    ? getMock().mockPickupApi.get(fulfillmentId)
    : request<import("@/types").PickUp>(`/pickup/${fulfillmentId}`),
  create: (body: Partial<import("@/types").PickUp>) => IS_MOCK
    ? getMock().mockPickupApi.create(body)
    : request<import("@/types").PickUp>("/pickup", { method: "POST", body: JSON.stringify(body) }),
  update: (fulfillmentId: number, body: Partial<import("@/types").PickUp>) => IS_MOCK
    ? getMock().mockPickupApi.update(fulfillmentId, body)
    : request<import("@/types").PickUp>(`/pickup/${fulfillmentId}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (fulfillmentId: number) => IS_MOCK
    ? Promise.resolve()
    : request(`/pickup/${fulfillmentId}`, { method: "DELETE" }),
};

// ─── Inventory ────────────────────────────────────────────────────────────────
// GET    /inventory
// POST   /inventory
// GET    /inventory/{inv_id}
// PUT    /inventory/{inv_id}
// DELETE /inventory/{inv_id}
// PATCH  /inventory/{inv_id}/adjust-stock
export const inventoryApi = {
  list: () => IS_MOCK
    ? getMock().mockInventoryApi.list()
    : request<import("@/types").InventoryItem[]>("/inventory"),
  get: (id: number) => IS_MOCK
    ? getMock().mockInventoryApi.get(id)
    : request<import("@/types").InventoryItem>(`/inventory/${id}`),
  create: (body: Partial<import("@/types").InventoryItem>) => IS_MOCK
    ? getMock().mockInventoryApi.create(body)
    : request<import("@/types").InventoryItem>("/inventory", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types").InventoryItem>) => IS_MOCK
    ? getMock().mockInventoryApi.update(id, body)
    : request<import("@/types").InventoryItem>(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => IS_MOCK
    ? Promise.resolve()
    : request(`/inventory/${id}`, { method: "DELETE" }),
  adjustStock: (id: number, adjustment: number) => IS_MOCK
    ? getMock().mockInventoryApi.adjustStock(id, adjustment)
    : request<import("@/types").InventoryItem>(`/inventory/${id}/adjust-stock`, { method: "PATCH", body: JSON.stringify({ adjustment }) }),
  // Derived client-side from list(); no dedicated /low-stock endpoint in the API
  lowStock: () => IS_MOCK
    ? getMock().mockInventoryApi.lowStock()
    : request<import("@/types").InventoryItem[]>("/inventory").then((items) =>
        items
          .filter((i) => i.inv_stock <= i.inv_rt)
          .map((i) => ({ ...i, is_low: true })) as import("@/types").LowStockItem[]
      ),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
// GET    /orders
// POST   /orders
// GET    /orders/{order_id}
// PUT    /orders/{order_id}
// DELETE /orders/{order_id}
// GET    /orders/customer/{customer_id}
export const ordersApi = {
  list: (page = 1, limit = 20, status?: string) => IS_MOCK
    ? getMock().mockOrdersApi.list(page, limit, status)
    : request<import("@/types").PaginatedResponse<import("@/types").Order>>(`/orders?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`),
  get: (id: number) => IS_MOCK
    ? getMock().mockOrdersApi.get(id)
    : request<import("@/types").Order>(`/orders/${id}`),
  create: (body: { customer_id: number; fulfillment_id: number; payment_method: string; cart_items: { product_id: number; quantity: number }[] }) => IS_MOCK
    ? getMock().mockOrdersApi.create(body)
    : request<import("@/types").Order>("/orders", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types").Order>) => IS_MOCK
    ? getMock().mockOrdersApi.update(id, body)
    : request<import("@/types").Order>(`/orders/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  // Status is updated via PUT /orders/{order_id} — no dedicated PATCH status endpoint
  updateStatus: (id: number, status: import("@/types").OrderStatus) => IS_MOCK
    ? getMock().mockOrdersApi.updateStatus(id, status)
    : request<import("@/types").Order>(`/orders/${id}`, { method: "PUT", body: JSON.stringify({ order_status: status }) }),
  delete: (id: number) => IS_MOCK
    ? Promise.resolve()
    : request(`/orders/${id}`, { method: "DELETE" }),
  getByCustomer: (customerId: number) => IS_MOCK
    ? getMock().mockOrdersApi.getByCustomer(customerId)
    : request<import("@/types").Order[]>(`/orders/customer/${customerId}`),
};

// ─── Riders ───────────────────────────────────────────────────────────────────
// GET    /riders
// POST   /riders
// GET    /riders/{rider_id}
// PUT    /riders/{rider_id}
// DELETE /riders/{rider_id}
// PATCH  /riders/{rider_id}/location
export const ridersApi = {
  list: () => IS_MOCK
    ? getMock().mockRidersApi.list()
    : request<import("@/types").Rider[]>("/riders"),
  get: (id: number) => IS_MOCK
    ? getMock().mockRidersApi.get(id)
    : request<import("@/types").Rider>(`/riders/${id}`),
  create: (body: Partial<import("@/types").Rider>) => IS_MOCK
    ? getMock().mockRidersApi.create(body)
    : request<import("@/types").Rider>("/riders", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types").Rider>) => IS_MOCK
    ? getMock().mockRidersApi.update(id, body)
    : request<import("@/types").Rider>(`/riders/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => IS_MOCK
    ? Promise.resolve()
    : request(`/riders/${id}`, { method: "DELETE" }),
  updateLocation: (id: number, location: string) => IS_MOCK
    ? getMock().mockRidersApi.updateLocation(id, location)
    : request<import("@/types").Rider>(`/riders/${id}/location`, { method: "PATCH", body: JSON.stringify({ current_location: location }) }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
// POST /admin/invite-staff
export const adminApi = {
  inviteStaff: (email: string) => IS_MOCK
    ? Promise.resolve({ message: "Invite sent (mock)" })
    : request<{ message: string }>("/admin/invite-staff", { method: "POST", body: JSON.stringify({ email }) }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
// GET /reports/weekly?week_start=YYYY-MM-DD  — weekly summary
// GET /reports/orders-by-status              — order counts grouped by status
export const reportsApi = {
  weeklySummary: (weekStart?: string) => IS_MOCK
    ? getMock().mockReportsApi.weeklySummary(weekStart)
    : request<import("@/types").WeeklySummary>(`/reports/weekly${weekStart ? `?week_start=${weekStart}` : ""}`),
  ordersByStatus: () => IS_MOCK
    ? getMock().mockReportsApi.ordersByStatus()
    : request<Record<import("@/types").OrderStatus, number>>("/reports/orders-by-status"),
};