// lib.ts
// Set NEXT_PUBLIC_MOCK=true in .env.local to use mock data (no backend needed)

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const IS_MOCK = false;

// ─── Real API ─────────────────────────────────────────────────────────────────
// Real API inside api.ts
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // 1. Manually extract the cookie value from the browser string
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const token = getCookie("sb-access-token");

  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { 
      "Content-Type": "application/json", 
      // 2. Explicitly inject the Bearer header so the original backend HTTPBearer() works!
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...options.headers 
    },
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
    : request<{ user: import("@/types/mytypes").User }>("/auth/me"),
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
    : request<import("@/types/mytypes").PaginatedResponse<import("@/types/mytypes").Customer>>(`/api/customers?page=${page}&limit=${limit}`),
  get: (id: string) => IS_MOCK
    ? getMock().mockCustomersApi.get(id)
    : request<import("@/types/mytypes").Customer>(`/customers/${id}`),
  create: (body: Partial<import("@/types/mytypes").Customer>) => IS_MOCK
    ? getMock().mockCustomersApi.create(body)
    : request<import("@/types/mytypes").Customer>("/customers", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types/mytypes").Customer>) => IS_MOCK
    ? getMock().mockCustomersApi.update(id, body)
    : request<import("@/types/mytypes").Customer>(`/customers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
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
    : request<import("@/types/mytypes").Product[]>("/products"),
  get: (id: number) => IS_MOCK
    ? getMock().mockProductsApi.get(id)
    : request<import("@/types/mytypes").Product>(`/products/${id}`),
  create: (body: Partial<import("@/types/mytypes").Product>) => IS_MOCK
    ? getMock().mockProductsApi.create(body)
    : request<import("@/types/mytypes").Product>("/products", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types/mytypes").Product>) => IS_MOCK
    ? getMock().mockProductsApi.update(id, body)
    : request<import("@/types/mytypes").Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
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
    : request<import("@/types/mytypes").BOMEntry[]>("/bom"),
  get: (id: number) => IS_MOCK
    ? getMock().mockBomApi.get(id)
    : request<import("@/types/mytypes").BOMEntry>(`/bom/${id}`),
  create: (body: Partial<import("@/types/mytypes").BOMEntry>) => IS_MOCK
    ? getMock().mockBomApi.create(body)
    : request<import("@/types/mytypes").BOMEntry>("/bom", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types/mytypes").BOMEntry>) => IS_MOCK
    ? getMock().mockBomApi.update(id, body)
    : request<import("@/types/mytypes").BOMEntry>(`/bom/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => IS_MOCK
    ? Promise.resolve()
    : request(`/bom/${id}`, { method: "DELETE" }),
  getByProduct: (productId: number) => IS_MOCK
    ? getMock().mockBomApi.getByProduct(productId)
    : request<import("@/types/mytypes").BOMEntry[]>(`/bom/product/${productId}`),
  getByIngredient: (inventoryId: number) => IS_MOCK
    ? getMock().mockBomApi.getByIngredient(inventoryId)
    : request<import("@/types/mytypes").BOMEntry[]>(`/bom/ingredient/${inventoryId}`),
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
    : request<import("@/types/mytypes").CartOrderLineItem[]>("/cart"),
  add: (body: { order_id: number; product_id: number; quantity: number }) => IS_MOCK
    ? getMock().mockCartApi.add(body)
    : request<import("@/types/mytypes").CartOrderLineItem>("/cart", { method: "POST", body: JSON.stringify(body) }),
  getByOrder: (orderId: number) => IS_MOCK
    ? getMock().mockCartApi.getByOrder(orderId)
    : request<import("@/types/mytypes").CartOrderLineItem[]>(`/cart/order/${orderId}`),
  removeItem: (orderId: number, productId: number) => IS_MOCK
    ? Promise.resolve()
    : request(`/cart/order/${orderId}/product/${productId}`, { method: "DELETE" }),
  bulkAdd: (orderId: number, items: { product_id: number; quantity: number }[]) => IS_MOCK
    ? getMock().mockCartApi.bulkAdd(orderId, items)
    : request<import("@/types/mytypes").CartOrderLineItem[]>(`/cart/order/${orderId}/bulk`, { method: "POST", body: JSON.stringify(items) }),
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
    : request<import("@/types/mytypes").Fulfillment[]>("/fulfillment"),
  get: (id: number) => IS_MOCK
    ? getMock().mockFulfillmentApi.get(id)
    : request<import("@/types/mytypes").Fulfillment>(`/fulfillment/${id}`),
  create: (body: Partial<import("@/types/mytypes").Fulfillment>) => IS_MOCK
    ? getMock().mockFulfillmentApi.create(body)
    : request<import("@/types/mytypes").Fulfillment>("/fulfillment", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types/mytypes").Fulfillment>) => IS_MOCK
    ? getMock().mockFulfillmentApi.update(id, body)
    : request<import("@/types/mytypes").Fulfillment>(`/fulfillment/${id}`, { method: "PUT", body: JSON.stringify(body) }),
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
    : request<import("@/types/mytypes").Delivery[]>("/delivery"),
  get: (fulfillmentId: number) => IS_MOCK
    ? getMock().mockDeliveryApi.get(fulfillmentId)
    : request<import("@/types/mytypes").Delivery>(`/delivery/${fulfillmentId}`),
  create: (body: Partial<import("@/types/mytypes").Delivery>) => IS_MOCK
    ? getMock().mockDeliveryApi.create(body)
    : request<import("@/types/mytypes").Delivery>("/delivery", { method: "POST", body: JSON.stringify(body) }),
  update: (fulfillmentId: number, body: Partial<import("@/types/mytypes").Delivery>) => IS_MOCK
    ? getMock().mockDeliveryApi.update(fulfillmentId, body)
    : request<import("@/types/mytypes").Delivery>(`/delivery/${fulfillmentId}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (fulfillmentId: number) => IS_MOCK
    ? Promise.resolve()
    : request(`/delivery/${fulfillmentId}`, { method: "DELETE" }),
  getByRider: (riderId: number) => IS_MOCK
    ? getMock().mockDeliveryApi.getByRider(riderId)
    : request<import("@/types/mytypes").Delivery[]>(`/delivery/rider/${riderId}`),
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
    : request<import("@/types/mytypes").PickUp[]>("/pickup"),
  get: (fulfillmentId: number) => IS_MOCK
    ? getMock().mockPickupApi.get(fulfillmentId)
    : request<import("@/types/mytypes").PickUp>(`/pickup/${fulfillmentId}`),
  create: (body: Partial<import("@/types/mytypes").PickUp>) => IS_MOCK
    ? getMock().mockPickupApi.create(body)
    : request<import("@/types/mytypes").PickUp>("/pickup", { method: "POST", body: JSON.stringify(body) }),
  update: (fulfillmentId: number, body: Partial<import("@/types/mytypes").PickUp>) => IS_MOCK
    ? getMock().mockPickupApi.update(fulfillmentId, body)
    : request<import("@/types/mytypes").PickUp>(`/pickup/${fulfillmentId}`, { method: "PUT", body: JSON.stringify(body) }),
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
export type UnitType = "pcs" | "ml" | "g" | "kg";

export const inventoryApi = {
  // GET /inventory
  list: () : Promise<import("@/types/mytypes").InventoryItem[]> =>
      request<import("@/types/mytypes").InventoryItem[]>("/inventory"),

  // GET /inventory/{inv_id}
  get: (id: number) =>
    IS_MOCK
      ? getMock().mockInventoryApi.get(id)
      : request<import("@/types/mytypes").InventoryItem>(`/inventory/${id}`),

  // POST /inventory — body fields: inv_ing_name, inv_stock, inv_uom, inv_rt
  create: (body: {
    inv_ing_name: string;
    inv_stock?: number;
    inv_uom: UnitType;
    inv_rt?: number;
  }) =>
    IS_MOCK
      ? getMock().mockInventoryApi.create(body)
      : request<import("@/types/mytypes").InventoryItem>("/inventory", {
          method: "POST",
          body: JSON.stringify(body),
        }),

  // DELETE /inventory/{inv_id}
  delete: (id: number) =>
    IS_MOCK
      ? Promise.resolve()
      : request(`/inventory/${id}`, { method: "DELETE" }),

  // PATCH /inventory/{inv_id}/adjust-stock?amount={amount}
  // amount > 0 to restock, amount < 0 to deduct
  // No request body — backend reads `amount` as a query parameter
  adjustStock: (id: number, amount: number) =>
    IS_MOCK
      ? getMock().mockInventoryApi.adjustStock(id, amount)
      : request<import("@/types/mytypes").InventoryItem>(
          `/inventory/${id}/adjust-stock?amount=${amount}`,
          { method: "PATCH" }
        ),

  // POST /inventory/deduct-by-order/{order_id}
  deductByOrder: (orderId: number) =>
    IS_MOCK
      ? Promise.resolve()
      : request(`/inventory/deduct-by-order/${orderId}`, { method: "POST" }),

  // Derived client-side — no dedicated /low-stock backend endpoint
  lowStock: () =>
    IS_MOCK
      ? getMock().mockInventoryApi.lowStock()
      : request<import("@/types/mytypes").InventoryItem[]>("/inventory").then(
          (items) =>
            items
              .filter((i) => i.inv_stock <= i.inv_rt)
              .map((i) => ({ ...i, is_low: true })) as import("@/types/mytypes").LowStockItem[]
        ),
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
    : request<import("@/types/mytypes").Rider[]>("/riders"),
  get: (id: number) => IS_MOCK
    ? getMock().mockRidersApi.get(id)
    : request<import("@/types/mytypes").Rider>(`/riders/${id}`),
  create: (body: Partial<import("@/types/mytypes").Rider>) => IS_MOCK
    ? getMock().mockRidersApi.create(body)
    : request<import("@/types/mytypes").Rider>("/riders", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types/mytypes").Rider>) => IS_MOCK
    ? getMock().mockRidersApi.update(id, body)
    : request<import("@/types/mytypes").Rider>(`/riders/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => IS_MOCK
    ? Promise.resolve()
    : request(`/riders/${id}`, { method: "DELETE" }),
  updateLocation: (id: number, location: string) => IS_MOCK
    ? getMock().mockRidersApi.updateLocation(id, location)
    : request<import("@/types/mytypes").Rider>(`/riders/${id}/location`, { method: "PATCH", body: JSON.stringify({ current_location: location }) }),
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
export const reportsApi = {
  weeklySummary: (weekStart?: string) =>
    IS_MOCK
      ? getMock().mockReportsApi.weeklySummary(weekStart)
      : request<import("@/types/mytypes").WeeklySummary>(
          `/reports/weekly${weekStart ? `?week_start=${weekStart}` : ""}`
        ),

  // No backend endpoint yet — mock only until /reports/orders-by-status is implemented
  ordersByStatus: () =>
    getMock().mockReportsApi.ordersByStatus() as Promise <
      Record<import("@/types/mytypes").OrderStatus, number>
    >,
};
// ─── Orders ───────────────────────────────────────────────────────────────────
// GET    /orders
// POST   /orders
// GET    /orders/{order_id}
// PUT    /orders/{order_id}
// DELETE /orders/{order_id}
// GET    /orders/customer/{customer_id}
// ─── Order request types (matching backend's CreateOrderRequest) ──────────────
export interface CreateOrderBody {
  cust_id: string;           // UUID as string
  total_amount: number;
  ord_pay_meth: "Cash" | "GCash";
  ord_f_type: "Delivery" | "Pick_Up";
  prod_ids: number[];        // list of product IDs → backend populates cart
  reference_no?: string;     // required only when ord_pay_meth === "GCash"
}

export const ordersApi = {
  // GET /orders — backend returns Order[], no pagination wrapper
  list: () =>
    IS_MOCK
      ? getMock().mockOrdersApi.list()
      : request<import("@/types/mytypes").Order[]>("/orders"),

  // GET /orders/{order_id}
  get: (id: number) =>
    IS_MOCK
      ? getMock().mockOrdersApi.get(id)
      : request<import("@/types/mytypes").Order>(`/orders/${id}`),

  // POST /orders — 201 Created; body must match CreateOrderRequest
  create: (body: CreateOrderBody) =>
    IS_MOCK
      ? getMock().mockOrdersApi.create(body)
      : request<import("@/types/mytypes").Order>("/orders", {
          method: "POST",
          body: JSON.stringify(body),
        }),

  // PUT /orders/{order_id} — full Order object required by backend
  update: (id: number, body: Partial<import("@/types/mytypes").Order>) =>
    IS_MOCK
      ? getMock().mockOrdersApi.update(id, body)
      : request<import("@/types/mytypes").Order>(`/orders/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),

  // Status update — still PUT /orders/{order_id}, only order_status patched
  updateStatus: (
    id: number,
    status: import("@/types/mytypes").OrderStatus
  ) =>
    IS_MOCK
      ? "getMock().mockOrdersApi.updateStatus(id, status)"
      : request<import("@/types/mytypes").Order>(`/orders/${id}`, {
          method: "PUT",
          body: JSON.stringify({ order_status: status }),
        }),

  // DELETE /orders/{order_id}
  delete: (id: number) =>
    IS_MOCK
      ? Promise.resolve()
      : request(`/orders/${id}`, { method: "DELETE" }),

  // GET /orders/customer/{customer_id} — cust_id is a UUID string on the backend
  getByCustomer: (customerId: string) =>
    IS_MOCK
      ? getMock().mockOrdersApi.getByCustomer(customerId)
      : request<import("@/types/mytypes").Order[]>(
          `/orders/customer/${customerId}`
        ),

  // GET /orders/{order_id}/bill?cust_id={cust_id}
  getBill: (orderId: number, custId: string) =>
    IS_MOCK
      ? ""
      : request(`/orders/${orderId}/bill?cust_id=${custId}`),
};