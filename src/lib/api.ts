// lib.ts
import {
    User,
    Customer,
    Product,
    BOMEntry,
    BOMBulkCreate,
    CartOrderLineItem,
    Fulfillment,
    Delivery,
    PickUp,
    InventoryItem,
    UnitType,
    LowStockItem,
    Rider,
    WeeklySummary,
    Order,
    OrderStatus,
} from "@/types";

import {     
    mockProducts,
    mockBOMEntries,
    mockCartOrderLineItems,
    mockFulfillments,
    mockInventory,
    mockRiders,
    mockOrders,
    mockWeeklySummary,
    mockLowStockItems, 
} from "@/lib/mockdata";

// Set NEXT_PUBLIC_MOCK=true in .env.local to use mock data 
const USE_MOCK = process.env.NEXT_PUBLIC_MOCK === "true";

// extract backend url
const BASE_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL ?? "http://localhost:8000";


// *─── Real API ─────────────────────────────────────────────────────────────────
// Real API inside api.ts
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    // 1. Manually extract the cookie value from the browser string
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
        return null;
    };

    const token = getCookie("sb-access-token");

    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            // 2. Explicitly inject the Bearer header so the original backend HTTPBearer() works!
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
        credentials: "include",
        ...options,
    });

    if (!res.ok) {
        // 1. Read the raw text first to prevent JSON parse crashes on 500 server errors
        const rawText = await res.text();
        let errorMessage = `HTTP Error ${res.status}: ${res.statusText}`;

        try {
            const errorJson = JSON.parse(rawText);
            const detail = errorJson.detail ?? errorJson.message;

            if (typeof detail === "string") {
                errorMessage = detail;
            } else if (Array.isArray(detail)) {
                // FastAPI 422 validation errors — array of { loc, msg, type }
                errorMessage = detail
                    .map(
                        (e: any) => e.loc?.slice(1).join(" -> ") + ": " + e.msg,
                    )
                    .join("; ");
            } else if (detail) {
                errorMessage = JSON.stringify(detail);
            }
        } catch {
            if (rawText) errorMessage = rawText;
        }

        console.error(`🚨 API failure on ${path}:`, errorMessage);
        throw new Error(errorMessage);
    }
    return res.json() as Promise<T>;
}

// *─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
    me: () => request<{ user: User }>("/auth/me"),
    logout: () => request("/auth/logout", { method: "POST" }),
    googleLoginUrl: `${BASE_URL}/auth/google`,
};
// *─── Customers ────────────────────────────────────────────────────────────────
// GET    /customers
// POST   /customers
// GET    /customers/{customer_id}
// PUT    /customers/{customer_id}
// DELETE /customers/{customer_id}
export const customersApi = {
    list: () => {
        request<Customer[]>("/customers")
    },

    get: (id: string) =>
        request<Customer>(`/customers/${id}`),

    create: (body: Partial<Customer>) =>
        request<Customer>("/customers", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    update: (id: string, body: Partial<Customer>) =>
        request<Customer>(`/customers/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        }),

    delete: (id: string) => request(`/customers/${id}`, { method: "DELETE" }),
};

// *─── Products ─────────────────────────────────────────────────────────────────
// POST   /products
// GET    /products
// GET    /products/{prod_id}
// PUT    /products/{prod_id}
// DELETE /products/{prod_id}
export const productsApi = {
    list: (params?: { availableOnly?: boolean; search?: string }) => {

        // ! mock data for testing
        if (USE_MOCK) {
            let results = mockProducts;
            if (params?.availableOnly) {
                results = results.filter((p) => p.prod_available);
            }
            if (params?.search) {
                const q = params.search.toLowerCase();
                results = results.filter((p) =>
                    p.prod_name.toLowerCase().includes(q),
                );
            }
            return Promise.resolve(results);
        }

        // retrieve data from url parameters 
        const searchParams = new URLSearchParams();

        if (params?.availableOnly) {
            searchParams.append("available_only", "true");
        }
        if (params?.search) {
            searchParams.append("search", params.search);
        }

        const queryString = searchParams.toString();
        const url = `/products${queryString ? `?${queryString}` : ""}`;

        return request<Product[]>(url);
    },

    get: (id: number) =>
        request<Product>(`/products/${id}`),
    create: (body: Partial<Product>) => {
        if (USE_MOCK) {
                const newProduct: Product = {
                prod_id: Math.max(0, ...mockProducts.map((p) => p.prod_id)) + 1,
                prod_name: body.prod_name ?? "Untitled Product",
                prod_desc: body.prod_desc,
                prod_price: body.prod_price ?? 0,
                prod_available: body.prod_available ?? true,
                prod_sl: body.prod_sl ?? "",
                prod_image_url: body.prod_image_url ?? "",
            };
            mockProducts.push(newProduct);
            return Promise.resolve(newProduct);
            
        }
        return request<Product>("/products", { method: "POST", body: JSON.stringify(body) });            
    },
    update: (id: number, body: Partial<Product>) => {

        if (USE_MOCK) {
            const i = mockProducts.findIndex((p) => p.prod_id === id);
            if (i === -1) return Promise.reject(new Error(`Product ${id} not found`));
            mockProducts[i] = { ...mockProducts[i], ...body };
            return Promise.resolve(mockProducts[i]);
        }
        return request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(body)});
    },

    delete: (id: number) => {
        if (USE_MOCK) {
            const i = mockProducts.findIndex((p) => p.prod_id === id);
            if (i !== -1) mockProducts.splice(i, 1);
            return Promise.resolve();
        }
        return request(`/products/${id}`, { method: "DELETE" })
    }
};

// ─── BOM (Bill of Materials) ───────────────────────────────────────────────────
// GET    /bom
// POST   /bom
// GET    /bom/{bom_id}
// PUT    /bom/{bom_id}
// DELETE /bom/{bom_id}
// GET    /bom/product/{prod_id}      — ingredients for a product
// GET    /bom/ingredient/{inventory_id} — products using an ingredient

export const bomApi = {
    list: () => request<BOMEntry[]>("/bom"),
    get: (id: number) =>
        request<BOMEntry>(`/bom/${id}`),
    create: (body: BOMBulkCreate) =>
        request<BOMEntry[]>("/bom", {
            method: "POST",
            body: JSON.stringify(body),
        }),
    update: (id: number, body: Partial<BOMEntry>) =>
        request<BOMEntry>(`/bom/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        }),
    delete: (id: number) => request(`/bom/${id}`, { method: "DELETE" }),
    getByProduct: (productId: number) =>
        request<BOMEntry[]>(
            `/bom/product/${productId}`,
        ),
    getByIngredient: (inventoryId: number) =>
        request<BOMEntry[]>(
            `/bom/ingredient/${inventoryId}`,
        ),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
// GET    /cart
// POST   /cart
// GET    /cart/order/{order_id}
// DELETE /cart/order/{order_id}/product/{prod_id}
// POST   /cart/order/{order_id}/bulk
export const cartApi = {
    list: () => request<CartOrderLineItem[]>("/cart"),
    add: (body: { order_id: number; prod_id: number; quantity: number }) =>
        request<CartOrderLineItem>("/cart", {
            method: "POST",
            body: JSON.stringify(body),
        }),
    getByOrder: (orderId: number) =>
        request<CartOrderLineItem[]>(
            `/cart/order/${orderId}`,
        ),
    removeItem: (orderId: number, productId: number) =>
        request(`/cart/order/${orderId}/product/${productId}`, {
            method: "DELETE",
        }),
    bulkAdd: (
        orderId: number,
        items: { prod_id: number; quantity: number }[],
    ) =>
        request<CartOrderLineItem[]>(
            `/cart/order/${orderId}/bulk`,
            { method: "POST", body: JSON.stringify(items) },
        ),
};

// ─── Fulfillment ──────────────────────────────────────────────────────────────
// GET    /fulfillment
// POST   /fulfillment
// GET    /fulfillment/{fulfillment_id}
// PUT    /fulfillment/{fulfillment_id}
// DELETE /fulfillment/{fulfillment_id}
export const fulfillmentApi = {
    list: () =>
        request<Fulfillment[]>("/fulfillment"),
    get: (id: number) =>
        request<Fulfillment>(`/fulfillment/${id}`),
    create: (body: Partial<Fulfillment>) =>
        request<Fulfillment>("/fulfillment", {
            method: "POST",
            body: JSON.stringify(body),
        }),
    update: (
        id: number,
        body: Partial<Fulfillment>,
    ) =>
        request<Fulfillment>(`/fulfillment/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        }),
    delete: (id: number) => request(`/fulfillment/${id}`, { method: "DELETE" }),
};

// ─── Delivery ─────────────────────────────────────────────────────────────────
// GET    /delivery
// POST   /delivery
// GET    /delivery/{fulfillment_id}
// PUT    /delivery/{fulfillment_id}
// DELETE /delivery/{fulfillment_id}
// GET    /delivery/rider/{rider_id}
export const deliveryApi = {
    list: () => request<Delivery[]>("/delivery"),
    get: (fulfillmentId: number) =>
        request<Delivery>(
            `/delivery/${fulfillmentId}`,
        ),
    create: (body: Partial<Delivery>) =>
        request<Delivery>("/delivery", {
            method: "POST",
            body: JSON.stringify(body),
        }),
    update: (
        fulfillmentId: number,
        body: Partial<Delivery>,
    ) =>
        request<Delivery>(
            `/delivery/${fulfillmentId}`,
            {
                method: "PUT",
                body: JSON.stringify(body),
            },
        ),
    delete: (fulfillmentId: number) =>
        request(`/delivery/${fulfillmentId}`, { method: "DELETE" }),
    getByRider: (riderId: number) =>
        request<Delivery[]>(
            `/delivery/rider/${riderId}`,
        ),
};

// ─── Pickup ───────────────────────────────────────────────────────────────────
// GET    /pickup
// POST   /pickup
// GET    /pickup/{fulfillment_id}
// PUT    /pickup/{fulfillment_id}
// DELETE /pickup/{fulfillment_id}
export const pickupApi = {
    list: () => request<PickUp[]>("/pickup"),
    get: (fulfillmentId: number) =>
        request<PickUp>(`/pickup/${fulfillmentId}`),
    create: (body: Partial<PickUp>) =>
        request<PickUp>("/pickup", {
            method: "POST",
            body: JSON.stringify(body),
        }),
    update: (
        fulfillmentId: number,
        body: Partial<PickUp>,
    ) =>
        request<PickUp>(`/pickup/${fulfillmentId}`, {
            method: "PUT",
            body: JSON.stringify(body),
        }),
    delete: (fulfillmentId: number) =>
        request(`/pickup/${fulfillmentId}`, { method: "DELETE" }),
};

// ─── Inventory ────────────────────────────────────────────────────────────────
// GET    /inventory
// POST   /inventory
// GET    /inventory/{inv_id}
// PUT    /inventory/{inv_id}
// DELETE /inventory/{inv_id}
// PATCH  /inventory/{inv_id}/adjust-stock
export const inventoryApi = {
    // GET /inventory
    list: (): Promise<InventoryItem[]> =>
        request<InventoryItem[]>("/inventory"),

    // GET /inventory/{inv_id}
    get: (id: number): Promise<InventoryItem> =>
        request<InventoryItem>(`/inventory/${id}`),

    // POST /inventory
    create: (body: {
        inv_ing_name: string;
        inv_stock?: number;
        inv_uom: UnitType;
        inv_rt?: number;
    }): Promise<InventoryItem> =>
        request<InventoryItem>("/inventory", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    // PUT /inventory/{inv_id}
    update: (
        id: number,
        body: {
            inv_ing_name?: string;
            inv_stock?: number; // FIXED: Added to fully mirror your backend DTO
            inv_uom?: UnitType;
            inv_rt?: number;
        },
    ): Promise<InventoryItem> =>
        request<InventoryItem>(`/inventory/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        }),

    // DELETE /inventory/{inv_id}
    delete: (id: number): Promise<{ message: string }> =>
        request<{ message: string }>(`/inventory/${id}`, { method: "DELETE" }),

    // PATCH /inventory/{inv_id}/adjust-stock?amount={amount}
    adjustStock: (id: number, amount: number): Promise<InventoryItem> =>
        request<InventoryItem>(
            `/inventory/${id}/adjust-stock?amount=${amount}`,
            {
                method: "PATCH",
            },
        ),

    // POST /inventory/deduct-by-order/{order_id}
    deductByOrder: (orderId: number): Promise<{ message: string }> =>
        request<{ message: string }>(`/inventory/deduct-by-order/${orderId}`, {
            method: "POST",
        }),

    // Client-side local evaluation
    lowStock: (): Promise<LowStockItem[]> =>
        request<InventoryItem[]>("/inventory").then((items) =>
            items
                .filter((i) => i.inv_stock <= i.inv_rt)
                .map((i) => ({ ...i, is_low: true })),
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
    list: () => request<Rider[]>("/riders"),
    get: (id: number) =>
        request<Rider>(`/riders/${id}`),
    create: (body: Partial<Rider>) =>
        request<Rider>("/riders", {
            method: "POST",
            body: JSON.stringify(body),
        }),
    update: (id: number, body: Partial<Rider>) =>
        request<Rider>(`/riders/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        }),
    delete: (id: number) => request(`/riders/${id}`, { method: "DELETE" }),
    updateLocation: (id: number, location: string) =>
        request<Rider>(`/riders/${id}/location`, {
            method: "PATCH",
            body: JSON.stringify({ current_location: location }),
        }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
// POST /admin/invite-staff
export const adminApi = {
    inviteStaff: (email: string) =>
        request<{ message: string }>("/admin/invite-staff", {
            method: "POST",
            body: JSON.stringify({ email }),
        }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
// GET /reports/weekly?week_start=YYYY-MM-DD  — weekly summary
export const reportsApi = {
    weeklySummary: (weekStart?: string) =>
        request<WeeklySummary>(
            `/reports/weekly${weekStart ? `?week_start=${weekStart}` : ""}`,
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
    cust_id: string; // UUID as string
    total_amount: number;
    ord_pay_meth: "Cash" | "GCash";
    ord_f_type: "Delivery" | "Pick_Up";
    prod_ids: number[]; // list of product IDs → backend populates cart
    reference_no?: string; // required only when ord_pay_meth === "GCash"
}

export const ordersApi = {
    // GET /orders — backend returns Order[], no pagination wrapper
    list: () => request<Order[]>("/orders"),

    // GET /orders/{order_id}
    get: (id: number) =>
        request<Order>(`/orders/${id}`),

    // POST /orders — 201 Created; body must match CreateOrderRequest
    create: (body: CreateOrderBody) =>
        request<Order>("/orders", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    // PUT /orders/{order_id} — full Order object required by backend
    update: (id: number, body: Partial<Order>) =>
        request<Order>(`/orders/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        }),

    // Status update — still PUT /orders/{order_id}, only order_status patched
    updateStatus: (id: number, status: OrderStatus) =>
        request<Order>(`/orders/${id}`, {
            method: "PUT",
            body: JSON.stringify({ order_status: status }),
        }),

    // DELETE /orders/{order_id}
    delete: (id: number) => request(`/orders/${id}`, { method: "DELETE" }),

    // GET /orders/customer/{customer_id} — cust_id is a UUID string on the backend
    getByCustomer: (customerId: string) =>
        request<Order[]>(
            `/orders/customer/${customerId}`,
        ),

    // GET /orders/{order_id}/bill?cust_id={cust_id}
    getBill: (orderId: number) => request(`/orders/${orderId}/bill`),
};
