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
    mockCustomers,
    mockBOMEntries,
    mockCartOrderLineItems,
    mockFulfillments,
    mockDeliveries,
    mockPickUps,
    mockInventory,
    mockRiders,
    mockOrders,
    mockWeeklySummary,
    mockLowStockItems,
} from "@/lib/mockdata";

// Set NEXT_PUBLIC_MOCK=true in .env.local to use mock data
const USE_MOCK = process.env.NEXT_PUBLIC_MOCK === "true";
export const IS_MOCK = USE_MOCK;

// extract backend url
const BASE_URL =
    process.env.NEXT_PUBLIC_API_BACKEND_URL ?? "http://localhost:8000";

const nextId = (values: number[]) => Math.max(0, ...values) + 1;
const notFound = (resource: string, id: string | number): never => {
    throw new Error(`${resource} ${id} not found`);
};

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
    me: () =>
        USE_MOCK
            ? Promise.resolve({
                user: {
                    id: "mock-user",
                    email: "demo@cookiecrave.test",
                    name: "Demo User",
                    role: "admin" as const,
                },
            })
            : request<{ user: User }>("/auth/me"),
    logout: () =>
        USE_MOCK
            ? Promise.resolve()
            : request("/auth/logout", { method: "POST" }),
    googleLoginUrl: `${BASE_URL}/auth/google`,
};
// *─── Customers ────────────────────────────────────────────────────────────────
// GET    /customers
// POST   /customers
// GET    /customers/{customer_id}
// PUT    /customers/{customer_id}
// DELETE /customers/{customer_id}
export const customersApi = {
    list: () =>
        USE_MOCK
            ? Promise.resolve(mockCustomers)
            : request<Customer[]>("/customers"),

    get: (id: string) => {
        if (USE_MOCK)
            return Promise.resolve(
                mockCustomers.find((customer) => customer.cust_id === id) ??
                    notFound("Customer", id),
            );
        return request<Customer>(`/customers/${id}`);
    },

    create: (body: Partial<Customer>) => {
        if (USE_MOCK) {
            const customer: Customer = {
                cust_id: body.cust_id ?? `mock-customer-${Date.now()}`,
                cust_lastname: body.cust_lastname ?? "",
                cust_firstname: body.cust_firstname ?? "",
                cust_middlename: body.cust_middlename,
                cust_email: body.cust_email ?? "",
                cust_cont_no: body.cust_cont_no,
                cust_cd: body.cust_cd ?? "",
                cust_social_provider: body.cust_social_provider ?? "google",
            };
            mockCustomers.push(customer);
            return Promise.resolve(customer);
        }
        return request<Customer>("/customers", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },

    update: (id: string, body: Partial<Customer>) => {
        if (USE_MOCK) {
            const index = mockCustomers.findIndex(
                (customer) => customer.cust_id === id,
            );
            if (index === -1)
                return Promise.reject(new Error(`Customer ${id} not found`));
            mockCustomers[index] = { ...mockCustomers[index], ...body };
            return Promise.resolve(mockCustomers[index]);
        }
        return request<Customer>(`/customers/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },

    delete: (id: string) => {
        if (USE_MOCK) {
            const index = mockCustomers.findIndex(
                (customer) => customer.cust_id === id,
            );
            if (index === -1)
                return Promise.reject(new Error(`Customer ${id} not found`));
            mockCustomers.splice(index, 1);
            return Promise.resolve();
        }
        return request(`/customers/${id}`, { method: "DELETE" });
    },
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

    get: (id: number) => {
        if (USE_MOCK)
            return Promise.resolve(
                mockProducts.find((product) => product.prod_id === id) ??
                    notFound("Product", id),
            );
        return request<Product>(`/products/${id}`);
    },
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
        return request<Product>("/products", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },
    update: (id: number, body: Partial<Product>) => {
        if (USE_MOCK) {
            const i = mockProducts.findIndex((p) => p.prod_id === id);
            if (i === -1)
                return Promise.reject(new Error(`Product ${id} not found`));
            mockProducts[i] = { ...mockProducts[i], ...body };
            return Promise.resolve(mockProducts[i]);
        }
        return request<Product>(`/products/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },

    delete: (id: number) => {
        if (USE_MOCK) {
            const i = mockProducts.findIndex((p) => p.prod_id === id);
            if (i !== -1) mockProducts.splice(i, 1);
            return Promise.resolve();
        }
        return request(`/products/${id}`, { method: "DELETE" });
    },
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
    list: () =>
        USE_MOCK
            ? Promise.resolve(mockBOMEntries)
            : request<BOMEntry[]>("/bom"),
    get: (id: number) => {
        if (USE_MOCK)
            return Promise.resolve(
                mockBOMEntries.find((entry) => entry.bom_id === id) ??
                    notFound("BOM entry", id),
            );
        return request<BOMEntry>(`/bom/${id}`);
    },
    create: (body: BOMBulkCreate) => {
        if (USE_MOCK) {
            const entries = body.ingredients.map((ingredient, index) => ({
                bom_id:
                    nextId(mockBOMEntries.map((entry) => entry.bom_id)) + index,
                prod_id: body.prod_id,
                ...ingredient,
            }));
            mockBOMEntries.push(...entries);
            return Promise.resolve(entries);
        }
        return request<BOMEntry[]>("/bom", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },
    update: (id: number, body: Partial<BOMEntry>) => {
        if (USE_MOCK) {
            const index = mockBOMEntries.findIndex(
                (entry) => entry.bom_id === id,
            );
            if (index === -1)
                return Promise.reject(new Error(`BOM entry ${id} not found`));
            mockBOMEntries[index] = { ...mockBOMEntries[index], ...body };
            return Promise.resolve(mockBOMEntries[index]);
        }
        return request<BOMEntry>(`/bom/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },
    delete: (id: number) => {
        if (USE_MOCK) {
            const index = mockBOMEntries.findIndex(
                (entry) => entry.bom_id === id,
            );
            if (index === -1)
                return Promise.reject(new Error(`BOM entry ${id} not found`));
            mockBOMEntries.splice(index, 1);
            return Promise.resolve();
        }
        return request(`/bom/${id}`, { method: "DELETE" });
    },
    getByProduct: (productId: number) =>
        USE_MOCK
            ? Promise.resolve(
                    mockBOMEntries.filter((entry) => entry.prod_id === productId),
                )
            : request<BOMEntry[]>(`/bom/product/${productId}`),
    getByIngredient: (inventoryId: number) =>
        USE_MOCK
            ? Promise.resolve(
                    mockBOMEntries.filter(
                        (entry) => entry.inv_id === inventoryId,
                    ),
                )
            : request<BOMEntry[]>(`/bom/ingredient/${inventoryId}`),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
// GET    /cart
// POST   /cart
// GET    /cart/order/{order_id}
// DELETE /cart/order/{order_id}/product/{prod_id}
// POST   /cart/order/{order_id}/bulk
export const cartApi = {
    list: () =>
        USE_MOCK
            ? Promise.resolve(mockCartOrderLineItems)
            : request<CartOrderLineItem[]>("/cart"),
    add: (body: { order_id: number; prod_id: number; quantity: number }) => {
        if (USE_MOCK) {
            const item = {
                ord_id: body.order_id,
                prod_id: body.prod_id,
                cart_quan: body.quantity,
            };
            mockCartOrderLineItems.push(item);
            return Promise.resolve(item);
        }
        return request<CartOrderLineItem>("/cart", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },
    getByOrder: (orderId: number) =>
        USE_MOCK
            ? Promise.resolve(
                    mockCartOrderLineItems.filter(
                        (item) => item.ord_id === orderId,
                    ),
                )
            : request<CartOrderLineItem[]>(`/cart/order/${orderId}`),
    removeItem: (orderId: number, productId: number) => {
        if (USE_MOCK) {
            const index = mockCartOrderLineItems.findIndex(
                (item) => item.ord_id === orderId && item.prod_id === productId,
            );
            if (index !== -1) mockCartOrderLineItems.splice(index, 1);
            return Promise.resolve();
        }
        return request(`/cart/order/${orderId}/product/${productId}`, {
            method: "DELETE",
        });
    },
    bulkAdd: (
        orderId: number,
        items: { prod_id: number; quantity: number }[],
    ) => {
        if (USE_MOCK) {
            const added = items.map((item) => ({
                ord_id: orderId,
                ...item,
                cart_quan: item.quantity,
            }));
            mockCartOrderLineItems.push(...added);
            return Promise.resolve(added);
        }
        return request<CartOrderLineItem[]>(`/cart/order/${orderId}/bulk`, {
            method: "POST",
            body: JSON.stringify(items),
        });
    },
};

// ─── Fulfillment ──────────────────────────────────────────────────────────────
// GET    /fulfillment
// POST   /fulfillment
// GET    /fulfillment/{fulfillment_id}
// PUT    /fulfillment/{fulfillment_id}
// DELETE /fulfillment/{fulfillment_id}
export const fulfillmentApi = {
    list: () =>
        USE_MOCK
            ? Promise.resolve(mockFulfillments)
            : request<Fulfillment[]>("/fulfillment"),
    get: (id: number) => {
        if (USE_MOCK)
            return Promise.resolve(
                mockFulfillments.find(
                    (fulfillment) => fulfillment.fulfillment_id === id,
                ) ?? notFound("Fulfillment", id),
            );
        return request<Fulfillment>(`/fulfillment/${id}`);
    },
    create: (body: Partial<Fulfillment>) => {
        if (USE_MOCK) {
            const fulfillment = {
                fulfillment_id: nextId(
                    mockFulfillments.map((item) => item.fulfillment_id),
                ),
                fulfillment_type: body.fulfillment_type ?? "Pick_Up",
            };
            mockFulfillments.push(fulfillment);
            return Promise.resolve(fulfillment);
        }
        return request<Fulfillment>("/fulfillment", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },
    update: (id: number, body: Partial<Fulfillment>) => {
        if (USE_MOCK) {
            const index = mockFulfillments.findIndex(
                (fulfillment) => fulfillment.fulfillment_id === id,
            );
            if (index === -1)
                return Promise.reject(new Error(`Fulfillment ${id} not found`));
            mockFulfillments[index] = { ...mockFulfillments[index], ...body };
            return Promise.resolve(mockFulfillments[index]);
        }
        return request<Fulfillment>(`/fulfillment/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },
    delete: (id: number) => {
        if (USE_MOCK) {
            const index = mockFulfillments.findIndex(
                (fulfillment) => fulfillment.fulfillment_id === id,
            );
            if (index !== -1) mockFulfillments.splice(index, 1);
            return Promise.resolve();
        }
        return request(`/fulfillment/${id}`, { method: "DELETE" });
    },
};

// ─── Delivery ─────────────────────────────────────────────────────────────────
// GET    /delivery
// POST   /delivery
// GET    /delivery/{fulfillment_id}
// PUT    /delivery/{fulfillment_id}
// DELETE /delivery/{fulfillment_id}
// GET    /delivery/rider/{rider_id}
export const deliveryApi = {
    list: () =>
        USE_MOCK
            ? Promise.resolve(mockDeliveries)
            : request<Delivery[]>("/delivery"),
    get: (fulfillmentId: number) => {
        if (USE_MOCK)
            return Promise.resolve(
                mockDeliveries.find(
                    (delivery) => delivery.fulfillment_id === fulfillmentId,
                ) ?? notFound("Delivery", fulfillmentId),
            );
        return request<Delivery>(`/delivery/${fulfillmentId}`);
    },
    create: (body: Partial<Delivery>) => {
        if (USE_MOCK) {
            const delivery: Delivery = {
                fulfillment_id:
                    body.fulfillment_id ??
                    nextId(mockFulfillments.map((item) => item.fulfillment_id)),
                address: body.address ?? "",
                ...body,
            };
            mockDeliveries.push(delivery);
            return Promise.resolve(delivery);
        }
        return request<Delivery>("/delivery", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },
    update: (fulfillmentId: number, body: Partial<Delivery>) => {
        if (USE_MOCK) {
            const index = mockDeliveries.findIndex(
                (delivery) => delivery.fulfillment_id === fulfillmentId,
            );
            if (index === -1)
                return Promise.reject(
                    new Error(`Delivery ${fulfillmentId} not found`),
                );
            mockDeliveries[index] = { ...mockDeliveries[index], ...body };
            return Promise.resolve(mockDeliveries[index]);
        }
        return request<Delivery>(`/delivery/${fulfillmentId}`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },
    delete: (fulfillmentId: number) => {
        if (USE_MOCK) {
            const index = mockDeliveries.findIndex(
                (delivery) => delivery.fulfillment_id === fulfillmentId,
            );
            if (index !== -1) mockDeliveries.splice(index, 1);
            return Promise.resolve();
        }
        return request(`/delivery/${fulfillmentId}`, { method: "DELETE" });
    },
    getByRider: (riderId: number) =>
        USE_MOCK
            ? Promise.resolve(
                    mockDeliveries.filter(
                        (delivery) => delivery.rider_id === String(riderId),
                    ),
                )
            : request<Delivery[]>(`/delivery/rider/${riderId}`),
};

// ─── Pickup ───────────────────────────────────────────────────────────────────
// GET    /pickup
// POST   /pickup
// GET    /pickup/{fulfillment_id}
// PUT    /pickup/{fulfillment_id}
// DELETE /pickup/{fulfillment_id}
export const pickupApi = {
    list: () =>
        USE_MOCK ? Promise.resolve(mockPickUps) : request<PickUp[]>("/pickup"),
    get: (fulfillmentId: number) => {
        if (USE_MOCK)
            return Promise.resolve(
                mockPickUps.find(
                    (pickup) => pickup.fulfillment_id === fulfillmentId,
                ) ?? notFound("Pickup", fulfillmentId),
            );
        return request<PickUp>(`/pickup/${fulfillmentId}`);
    },
    create: (body: Partial<PickUp>) => {
        if (USE_MOCK) {
            const pickup: PickUp = {
                fulfillment_id:
                    body.fulfillment_id ??
                    nextId(mockFulfillments.map((item) => item.fulfillment_id)),
                ...body,
            };
            mockPickUps.push(pickup);
            return Promise.resolve(pickup);
        }
        return request<PickUp>("/pickup", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },
    update: (fulfillmentId: number, body: Partial<PickUp>) => {
        if (USE_MOCK) {
            const index = mockPickUps.findIndex(
                (pickup) => pickup.fulfillment_id === fulfillmentId,
            );
            if (index === -1)
                return Promise.reject(
                    new Error(`Pickup ${fulfillmentId} not found`),
                );
            mockPickUps[index] = { ...mockPickUps[index], ...body };
            return Promise.resolve(mockPickUps[index]);
        }
        return request<PickUp>(`/pickup/${fulfillmentId}`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },
    delete: (fulfillmentId: number) => {
        if (USE_MOCK) {
            const index = mockPickUps.findIndex(
                (pickup) => pickup.fulfillment_id === fulfillmentId,
            );
            if (index !== -1) mockPickUps.splice(index, 1);
            return Promise.resolve();
        }
        return request(`/pickup/${fulfillmentId}`, { method: "DELETE" });
    },
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
        USE_MOCK
            ? Promise.resolve(mockInventory)
            : request<InventoryItem[]>("/inventory"),

    // GET /inventory/{inv_id}
    get: (id: number): Promise<InventoryItem> => {
        if (USE_MOCK)
            return Promise.resolve(
                mockInventory.find((item) => item.inv_id === id) ??
                    notFound("Inventory item", id),
            );
        return request<InventoryItem>(`/inventory/${id}`);
    },

    // POST /inventory
    create: (body: {
        inv_ing_name: string;
        inv_stock?: number;
        inv_uom: UnitType;
        inv_rt?: number;
    }): Promise<InventoryItem> => {
        if (USE_MOCK) {
            const item: InventoryItem = {
                inv_id: nextId(mockInventory.map((entry) => entry.inv_id)),
                inv_ing_name: body.inv_ing_name,
                inv_stock: body.inv_stock ?? 0,
                inv_uom: body.inv_uom,
                inv_rt: body.inv_rt ?? 0,
            };
            mockInventory.push(item);
            return Promise.resolve(item);
        }
        return request<InventoryItem>("/inventory", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },

    // PUT /inventory/{inv_id}
    update: (
        id: number,
        body: {
            inv_ing_name?: string;
            inv_stock?: number; // FIXED: Added to fully mirror your backend DTO
            inv_uom?: UnitType;
            inv_rt?: number;
        },
    ): Promise<InventoryItem> => {
        if (USE_MOCK) {
            const index = mockInventory.findIndex((item) => item.inv_id === id);
            if (index === -1)
                return Promise.reject(
                    new Error(`Inventory item ${id} not found`),
                );
            mockInventory[index] = { ...mockInventory[index], ...body };
            return Promise.resolve(mockInventory[index]);
        }
        return request<InventoryItem>(`/inventory/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },

    // DELETE /inventory/{inv_id}
    delete: (id: number): Promise<{ message: string }> => {
        if (USE_MOCK) {
            const index = mockInventory.findIndex((item) => item.inv_id === id);
            if (index === -1)
                return Promise.reject(
                    new Error(`Inventory item ${id} not found`),
                );
            mockInventory.splice(index, 1);
            return Promise.resolve({ message: "Inventory item deleted" });
        }
        return request<{ message: string }>(`/inventory/${id}`, {
            method: "DELETE",
        });
    },

    // PATCH /inventory/{inv_id}/adjust-stock?amount={amount}
    adjustStock: (id: number, amount: number): Promise<InventoryItem> => {
        if (USE_MOCK) {
            const item = mockInventory.find((entry) => entry.inv_id === id);
            if (!item)
                return Promise.reject(
                    new Error(`Inventory item ${id} not found`),
                );
            item.inv_stock += amount;
            return Promise.resolve(item);
        }
        return request<InventoryItem>(
            `/inventory/${id}/adjust-stock?amount=${amount}`,
            {
                method: "PATCH",
            },
        );
    },

    // POST /inventory/deduct-by-order/{order_id}
    deductByOrder: (orderId: number): Promise<{ message: string }> => {
        if (USE_MOCK)
            return Promise.resolve({
                message: `Inventory deducted for order ${orderId}`,
            });
        return request<{ message: string }>(
            `/inventory/deduct-by-order/${orderId}`,
            {
                method: "POST",
            },
        );
    },

    // Client-side local evaluation
    lowStock: (): Promise<LowStockItem[]> =>
        (USE_MOCK
            ? Promise.resolve(mockInventory)
            : request<InventoryItem[]>("/inventory")
        ).then((items) =>
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
    list: () =>
        USE_MOCK ? Promise.resolve(mockRiders) : request<Rider[]>("/riders"),
    get: (id: number) =>
        USE_MOCK
                ? Promise.resolve(
                    mockRiders.find((rider) => rider.rider_id === String(id)) ??
                        notFound("Rider", id),
                )
            : request<Rider>(`/riders/${id}`),
    create: (body: Partial<Rider>) => {
        if (USE_MOCK) {
            const rider: Rider = {
                rider_id: body.rider_id ?? `mock-rider-${Date.now()}`,
                rider_name: body.rider_name ?? "",
                rider_contact_num: body.rider_contact_num,
            };
            mockRiders.push(rider);
            return Promise.resolve(rider);
        }
        return request<Rider>("/riders", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },
    update: (id: number, body: Partial<Rider>) => {
        if (USE_MOCK) {
            const index = mockRiders.findIndex(
                (rider) => rider.rider_id === String(id),
            );
            if (index === -1)
                return Promise.reject(new Error(`Rider ${id} not found`));
            mockRiders[index] = { ...mockRiders[index], ...body };
            return Promise.resolve(mockRiders[index]);
        }
        return request<Rider>(`/riders/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },
    delete: (id: number) => {
        if (USE_MOCK) {
            const index = mockRiders.findIndex(
                (rider) => rider.rider_id === String(id),
            );
            if (index !== -1) mockRiders.splice(index, 1);
            return Promise.resolve();
        }
        return request(`/riders/${id}`, { method: "DELETE" });
    },
    updateLocation: (id: number, location: string) =>
        USE_MOCK
            ? Promise.resolve(
                    mockRiders.find((rider) => rider.rider_id === String(id)) ??
                        notFound("Rider", id),
                )
            : request<Rider>(`/riders/${id}/location`, {
                    method: "PATCH",
                    body: JSON.stringify({ current_location: location }),
                }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
// POST /admin/invite-staff
export const adminApi = {
    inviteStaff: (email: string) =>
        USE_MOCK
            ? Promise.resolve({ message: `Invitation sent to ${email}` })
            : request<{ message: string }>("/admin/invite-staff", {
                    method: "POST",
                    body: JSON.stringify({ email }),
                }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
// GET /reports/weekly?week_start=YYYY-MM-DD  — weekly summary
export const reportsApi = {
    weeklySummary: (weekStart?: string) =>
        USE_MOCK
            ? Promise.resolve(mockWeeklySummary)
            : request<WeeklySummary>(
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
    list: () =>
        USE_MOCK ? Promise.resolve(mockOrders) : request<Order[]>("/orders"),

    // GET /orders/{order_id}
    get: (id: number) =>
        USE_MOCK
            ? Promise.resolve(
                    mockOrders.find((order) => order.ord_id === id) ??
                        notFound("Order", id),
                )
            : request<Order>(`/orders/${id}`),

    // POST /orders — 201 Created; body must match CreateOrderRequest
    create: (body: CreateOrderBody) => {
        if (USE_MOCK) {
            const order: Order = {
                ord_id: nextId(mockOrders.map((item) => item.ord_id)),
                cust_id: body.cust_id,
                fulfillment_id: nextId(
                    mockFulfillments.map((item) => item.fulfillment_id),
                ),
                ord_time: new Date(),
                ord_fulfillment_time: new Date(),
                total_amount: body.total_amount,
                ord_pay_meth: body.ord_pay_meth,
                order_status: "Pending",
            };
            mockOrders.push(order);
            body.prod_ids.forEach((prod_id) =>
                mockCartOrderLineItems.push({
                    ord_id: order.ord_id,
                    prod_id,
                    cart_quan: 1,
                }),
            );
            return Promise.resolve(order);
        }
        return request<Order>("/orders", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },

    // PUT /orders/{order_id} — full Order object required by backend
    update: (id: number, body: Partial<Order>) => {
        if (USE_MOCK) {
            const index = mockOrders.findIndex((order) => order.ord_id === id);
            if (index === -1)
                return Promise.reject(new Error(`Order ${id} not found`));
            mockOrders[index] = { ...mockOrders[index], ...body };
            return Promise.resolve(mockOrders[index]);
        }
        return request<Order>(`/orders/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },

    // Status update — still PUT /orders/{order_id}, only order_status patched
    updateStatus: (id: number, status: OrderStatus) => {
        if (USE_MOCK) {
            const order = mockOrders.find((item) => item.ord_id === id);
            if (!order)
                return Promise.reject(new Error(`Order ${id} not found`));
            order.order_status = status;
            return Promise.resolve(order);
        }
        return request<Order>(`/orders/${id}`, {
            method: "PUT",
            body: JSON.stringify({ order_status: status }),
        });
    },

    // DELETE /orders/{order_id}
    delete: (id: number) => {
        if (USE_MOCK) {
            const index = mockOrders.findIndex((order) => order.ord_id === id);
            if (index !== -1) mockOrders.splice(index, 1);
            return Promise.resolve();
        }
        return request(`/orders/${id}`, { method: "DELETE" });
    },

    // GET /orders/customer/{customer_id} — cust_id is a UUID string on the backend
    getByCustomer: (customerId: string) =>
        USE_MOCK
            ? Promise.resolve(
                    mockOrders.filter((order) => order.cust_id === customerId),
                )
            : request<Order[]>(`/orders/customer/${customerId}`),

    // GET /orders/{order_id}/bill?cust_id={cust_id}
    getBill: (orderId: number) => request(`/orders/${orderId}/bill`),
};
