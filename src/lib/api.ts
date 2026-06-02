// lib.ts
// Set NEXT_PUBLIC_MOCK=true in .env.local to use mock data (no backend needed)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
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
  me: () => request<{ user: import("@/types/mytypes").User }>("/auth/me"),
  logout: () =>  request("/auth/logout", { method: "POST" }),
  googleLoginUrl: `${BASE_URL}/api/auth/google`,
};
// ─── Customers ────────────────────────────────────────────────────────────────
// GET    /api/customers
// POST   /api/customers
// GET    /api/customers/{customer_id}
// PUT    /api/customers/{customer_id}
// DELETE /api/customers/{customer_id}
export const customersApi = {
  list: (page = 1, limit = 20) =>  request<import("@/types/mytypes").PaginatedResponse<import("@/types/mytypes").Customer>>(`/api/customers?page=${page}&limit=${limit}`),
  get: (id: string) =>  request<import("@/types/mytypes").Customer>(`/customers/${id}`),
  create: (body: Partial<import("@/types/mytypes").Customer>) => request<import("@/types/mytypes").Customer>("/customers", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types/mytypes").Customer>) => request<import("@/types/mytypes").Customer>(`/customers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => request(`/customers/${id}`, { method: "DELETE" }),
};

// ─── Products ─────────────────────────────────────────────────────────────────
// POST   /products
// GET    /products
// GET    /products/{product_id}
// PUT    /products/{product_id}
// DELETE /products/{product_id}
export const productsApi = {
  list: () =>  request<import("@/types/mytypes").Product[]>("/products"),
  get: (id: number) => 
    // IS_MOCK ? getMock().mockProductsApi.get(id): 
    request<import("@/types/mytypes").Product>(`/products/${id}`),
  create: (body: Partial<import("@/types/mytypes").Product>) => request<import("@/types/mytypes").Product>("/products", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types/mytypes").Product>) => request<import("@/types/mytypes").Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => request(`/products/${id}`, { method: "DELETE" }),
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
  list: () => request<import("@/types/mytypes").BOMEntry[]>("/bom"),
  get: (id: number) => request<import("@/types/mytypes").BOMEntry>(`/bom/${id}`),
  create: (body: Partial<import("@/types/mytypes").BOMEntry>) =>  request<import("@/types/mytypes").BOMEntry>("/bom", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types/mytypes").BOMEntry>) =>  request<import("@/types/mytypes").BOMEntry>(`/bom/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) =>  request(`/bom/${id}`, { method: "DELETE" }),
  getByProduct: (productId: number) => request<import("@/types/mytypes").BOMEntry[]>(`/bom/product/${productId}`),
  getByIngredient: (inventoryId: number) => request<import("@/types/mytypes").BOMEntry[]>(`/bom/ingredient/${inventoryId}`),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
// GET    /cart
// POST   /cart
// GET    /cart/order/{order_id}
// DELETE /cart/order/{order_id}/product/{product_id}
// POST   /cart/order/{order_id}/bulk
export const cartApi = {
  list: () => request<import("@/types/mytypes").CartOrderLineItem[]>("/cart"),
  add: (body: { order_id: number; product_id: number; quantity: number }) => request<import("@/types/mytypes").CartOrderLineItem>("/cart", { method: "POST", body: JSON.stringify(body) }),
  getByOrder: (orderId: number) => request<import("@/types/mytypes").CartOrderLineItem[]>(`/cart/order/${orderId}`),
  removeItem: (orderId: number, productId: number) => request(`/cart/order/${orderId}/product/${productId}`, { method: "DELETE" }),
  bulkAdd: (orderId: number, items: { product_id: number; quantity: number }[]) => request<import("@/types/mytypes").CartOrderLineItem[]>(`/cart/order/${orderId}/bulk`, { method: "POST", body: JSON.stringify(items) }),
};

// ─── Fulfillment ──────────────────────────────────────────────────────────────
// GET    /fulfillment
// POST   /fulfillment
// GET    /fulfillment/{fulfillment_id}
// PUT    /fulfillment/{fulfillment_id}
// DELETE /fulfillment/{fulfillment_id}
export const fulfillmentApi = {
  list: () =>  request<import("@/types/mytypes").Fulfillment[]>("/fulfillment"),
  get: (id: number) => request<import("@/types/mytypes").Fulfillment>(`/fulfillment/${id}`),
  create: (body: Partial<import("@/types/mytypes").Fulfillment>) => request<import("@/types/mytypes").Fulfillment>("/fulfillment", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types/mytypes").Fulfillment>) => request<import("@/types/mytypes").Fulfillment>(`/fulfillment/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) =>  request(`/fulfillment/${id}`, { method: "DELETE" }),
};

// ─── Delivery ─────────────────────────────────────────────────────────────────
// GET    /delivery
// POST   /delivery
// GET    /delivery/{fulfillment_id}
// PUT    /delivery/{fulfillment_id}
// DELETE /delivery/{fulfillment_id}
// GET    /delivery/rider/{rider_id}
export const deliveryApi = {
  list: () =>  request<import("@/types/mytypes").Delivery[]>("/delivery"),
  get: (fulfillmentId: number) =>  request<import("@/types/mytypes").Delivery>(`/delivery/${fulfillmentId}`),
  create: (body: Partial<import("@/types/mytypes").Delivery>) => request<import("@/types/mytypes").Delivery>("/delivery", { method: "POST", body: JSON.stringify(body) }),
  update: (fulfillmentId: number, body: Partial<import("@/types/mytypes").Delivery>) => request<import("@/types/mytypes").Delivery>(`/delivery/${fulfillmentId}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (fulfillmentId: number) =>request(`/delivery/${fulfillmentId}`, { method: "DELETE" }),
  getByRider: (riderId: number) => request<import("@/types/mytypes").Delivery[]>(`/delivery/rider/${riderId}`),
};

// ─── Pickup ───────────────────────────────────────────────────────────────────
// GET    /pickup
// POST   /pickup
// GET    /pickup/{fulfillment_id}
// PUT    /pickup/{fulfillment_id}
// DELETE /pickup/{fulfillment_id}
export const pickupApi = {
  list: () => request<import("@/types/mytypes").PickUp[]>("/pickup"),
  get: (fulfillmentId: number) =>  request<import("@/types/mytypes").PickUp>(`/pickup/${fulfillmentId}`),
  create: (body: Partial<import("@/types/mytypes").PickUp>) => request<import("@/types/mytypes").PickUp>("/pickup", { method: "POST", body: JSON.stringify(body) }),
  update: (fulfillmentId: number, body: Partial<import("@/types/mytypes").PickUp>) => request<import("@/types/mytypes").PickUp>(`/pickup/${fulfillmentId}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (fulfillmentId: number) =>  request(`/pickup/${fulfillmentId}`, { method: "DELETE" }),
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
  get: (id: number) => request<import("@/types/mytypes").InventoryItem>(`/inventory/${id}`),

  // POST /inventory — body fields: inv_ing_name, inv_stock, inv_uom, inv_rt
  create: (body: {
    inv_ing_name: string;
    inv_stock?: number;
    inv_uom: UnitType;
    inv_rt?: number;
  }) => request<import("@/types/mytypes").InventoryItem>("/inventory", {
          method: "POST",
          body: JSON.stringify(body),
        }),

  // DELETE /inventory/{inv_id}
  delete: (id: number) => request(`/inventory/${id}`, { method: "DELETE" }),

  // PATCH /inventory/{inv_id}/adjust-stock?amount={amount}
  // amount > 0 to restock, amount < 0 to deduct
  // No request body — backend reads `amount` as a query parameter
  adjustStock: (id: number, amount: number) => request<import("@/types/mytypes").InventoryItem>(
          `/inventory/${id}/adjust-stock?amount=${amount}`,
          { method: "PATCH" }
        ),

  // POST /inventory/deduct-by-order/{order_id}
  deductByOrder: (orderId: number) => request(`/inventory/deduct-by-order/${orderId}`, { method: "POST" }),

  // Derived client-side — no dedicated /low-stock backend endpoint
  lowStock: () => request<import("@/types/mytypes").InventoryItem[]>("/inventory").then(
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
  list: () => request<import("@/types/mytypes").Rider[]>("/riders"),
  get: (id: number) => request<import("@/types/mytypes").Rider>(`/riders/${id}`),
  create: (body: Partial<import("@/types/mytypes").Rider>) => request<import("@/types/mytypes").Rider>("/riders", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<import("@/types/mytypes").Rider>) => request<import("@/types/mytypes").Rider>(`/riders/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) => request(`/riders/${id}`, { method: "DELETE" }),
  updateLocation: (id: number, location: string) => request<import("@/types/mytypes").Rider>(`/riders/${id}/location`, { method: "PATCH", body: JSON.stringify({ current_location: location }) }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
// POST /admin/invite-staff
export const adminApi = {
  inviteStaff: (email: string) => request<{ message: string }>("/admin/invite-staff", { method: "POST", body: JSON.stringify({ email }) }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
// GET /reports/weekly?week_start=YYYY-MM-DD  — weekly summary
export const reportsApi = {
  weeklySummary: (weekStart?: string) => request<import("@/types/mytypes").WeeklySummary>(
          `/reports/weekly${weekStart ? `?week_start=${weekStart}` : ""}`
        ),
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
  list: () => request<import("@/types/mytypes").Order[]>("/orders"),

  // GET /orders/{order_id}
  get: (id: number) => request<import("@/types/mytypes").Order>(`/orders/${id}`),

  // POST /orders — 201 Created; body must match CreateOrderRequest
  create: (body: CreateOrderBody) => request<import("@/types/mytypes").Order>("/orders", {
          method: "POST",
          body: JSON.stringify(body),
        }),

  // PUT /orders/{order_id} — full Order object required by backend
  update: (id: number, body: Partial<import("@/types/mytypes").Order>) =>request<import("@/types/mytypes").Order>(`/orders/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),

  // Status update — still PUT /orders/{order_id}, only order_status patched
  updateStatus: (
    id: number,
    status: import("@/types/mytypes").OrderStatus
  ) => request<import("@/types/mytypes").Order>(`/orders/${id}`, {
          method: "PUT",
          body: JSON.stringify({ order_status: status }),
        }),

  // DELETE /orders/{order_id}
  delete: (id: number) => request(`/orders/${id}`, { method: "DELETE" }),

  // GET /orders/customer/{customer_id} — cust_id is a UUID string on the backend
  getByCustomer: (customerId: string) => request<import("@/types/mytypes").Order[]>(
          `/orders/customer/${customerId}`
        ),

  // GET /orders/{order_id}/bill?cust_id={cust_id}
  getBill: (orderId: number, custId: string) => request(`/orders/${orderId}/bill?cust_id=${custId}`),
};