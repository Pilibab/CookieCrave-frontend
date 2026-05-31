// ─── Mock API — mirrors lib/api.ts but returns local data ────────────────────
import {
  mockCustomers, mockProducts, mockInventory,
  mockLowStock, mockOrders, mockWeeklySummary, mockRiders, mockBomEntries,
} from "./mockData";
import type { OrderStatus, Fulfillment, Delivery, PickUp, BOMEntry, CartOrderLineItem } from "@/types";

const delay = <T>(val: T): Promise<T> =>
  new Promise((res) => setTimeout(() => res(val), 300));

export const mockCustomersApi = {
  list: (page = 1, limit = 20) => delay({
    data: mockCustomers.slice((page - 1) * limit, page * limit),
    total: mockCustomers.length, page, limit,
  }),
  get: (id: number) => delay(mockCustomers.find((c) => c.customer_id === id) ?? mockCustomers[0]),
  create: (body: object) => delay({ ...mockCustomers[0], ...body, customer_id: 99, created_at: new Date().toISOString() }),
  update: (id: number, body: object) => delay({ ...mockCustomers[0], ...body }),
};

// Mutable local store so create/update/delete are reflected on refetch
let _products = [...mockProducts];
let _nextProductId = 100;

export const mockProductsApi = {
  list: () => delay([..._products]),
  get: (id: number) => delay(_products.find((p) => p.product_id === id) ?? _products[0]),
  create: (body: object) => {
    const newProduct = { ..._products[0], ...body, product_id: _nextProductId++ };
    _products = [..._products, newProduct];
    return delay(newProduct);
  },
  update: (id: number, body: object) => {
    _products = _products.map((p) => p.product_id === id ? { ...p, ...body } : p);
    return delay(_products.find((p) => p.product_id === id) ?? _products[0]);
  },
  delete: (id: number) => {
    _products = _products.filter((p) => p.product_id !== id);
    return delay(undefined);
  },
};

export const mockBomApi = {
  list: () => delay(mockBomEntries),
  get: (id: number) => delay(mockBomEntries.find((b) => b.bom_id === id) ?? mockBomEntries[0]),
  create: (body: object) => delay({ ...mockBomEntries[0], ...body, bom_id: 99 }),
  update: (id: number, body: object) => delay({ ...mockBomEntries[0], ...body }),
  getByProduct: (productId: number) => delay(mockBomEntries.filter((b) => b.product_id === productId)),
  getByIngredient: (inventoryId: number) => delay(mockBomEntries.filter((b) => b.inventory_id === inventoryId)),
};

export const mockCartApi = {
  list: () => delay(mockOrders.flatMap((o) => o.cart_items ?? []) as CartOrderLineItem[]),
  add: (body: object) => delay({ ...(mockOrders[0].cart_items?.[0] ?? {}), ...body } as CartOrderLineItem),
  getByOrder: (orderId: number) => delay(
    (mockOrders.find((o) => o.order_id === orderId)?.cart_items ?? []) as CartOrderLineItem[]
  ),
  bulkAdd: (orderId: number, items: { product_id: number; quantity: number }[]) =>
    delay(items.map((i) => ({
      order_id: orderId,
      product_id: i.product_id,
      quantity: i.quantity,
      price_per_item: mockProducts.find((p) => p.product_id === i.product_id)?.price ?? 0,
    })) as CartOrderLineItem[]),
};

export const mockOrdersApi = {
  list: (page = 1, limit = 20, status?: string) => {
    const filtered = status ? mockOrders.filter((o) => o.order_status === status) : mockOrders;
    return delay({ data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit });
  },
  get: (id: number) => delay(mockOrders.find((o) => o.order_id === id) ?? mockOrders[0]),
  create: (body: object) => delay({ ...mockOrders[0], ...body, order_id: 9999 }),
  update: (id: number, body: object) => delay({ ...mockOrders.find((o) => o.order_id === id) ?? mockOrders[0], ...body }),
  updateStatus: (id: number, status: OrderStatus) =>
    delay({ ...mockOrders.find((o) => o.order_id === id) ?? mockOrders[0], order_status: status }),
  getByCustomer: (customerId: number) => delay(mockOrders.filter((o) => o.customer_id === customerId)),
};

export const mockInventoryApi = {
  list: () => delay(mockInventory),
  get: (id: number) => delay(mockInventory.find((i) => i.inventory_id === id) ?? mockInventory[0]),
  update: (id: number, body: object) => delay({ ...mockInventory[0], ...body }),
  create: (body: object) => delay({ ...mockInventory[0], ...body, inventory_id: 99 }),
  adjustStock: (id: number, adjustment: number) => {
    const item = mockInventory.find((i) => i.inventory_id === id) ?? mockInventory[0];
    return delay({ ...item, current_stock: item.current_stock + adjustment });
  },
  lowStock: () => delay(mockLowStock),
};

export const mockReportsApi = {
  weeklySummary: (_weekStart?: string) => delay(mockWeeklySummary),
  ordersByStatus: () => delay(mockWeeklySummary.orders_by_status),
};

export const mockFulfillmentApi = {
  list: () => delay(mockOrders.map((o) => o.fulfillment).filter(Boolean) as Fulfillment[]),
  get: (id: number) => delay(
    mockOrders.find((o) => o.fulfillment_id === id)?.fulfillment ?? { fulfillment_id: id, fulfillment_type: "Delivery" as const }
  ),
  create: (body: object) => delay({ fulfillment_id: 99, fulfillment_type: "Delivery" as const, ...body } as Fulfillment),
  update: (id: number, body: object) => delay({ fulfillment_id: id, fulfillment_type: "Delivery" as const, ...body } as Fulfillment),
};

export const mockDeliveryApi = {
  list: () => delay(
    mockOrders
      .filter((o) => o.fulfillment?.fulfillment_type === "Delivery")
      .map((o) => o.fulfillment!.delivery!)
      .filter(Boolean) as Delivery[]
  ),
  get: (fulfillmentId: number) => {
    const d = mockOrders.find((o) => o.fulfillment_id === fulfillmentId)?.fulfillment?.delivery;
    return delay(d ?? { fulfillment_id: fulfillmentId, address: "Unknown" } as Delivery);
  },
  create: (body: object) => delay({ fulfillment_id: 99, address: "", ...body } as Delivery),
  update: (fulfillmentId: number, body: object) => delay({ fulfillment_id: fulfillmentId, address: "", ...body } as Delivery),
  getByRider: (riderId: number) => delay(
    mockOrders
      .filter((o) => o.fulfillment?.delivery?.rider_id === riderId)
      .map((o) => o.fulfillment!.delivery!)
      .filter(Boolean) as Delivery[]
  ),
};

export const mockPickupApi = {
  list: () => delay(
    mockOrders
      .filter((o) => o.fulfillment?.fulfillment_type === "Pick_Up")
      .map((o) => o.fulfillment!.pick_up!)
      .filter(Boolean) as PickUp[]
  ),
  get: (fulfillmentId: number) => {
    const p = mockOrders.find((o) => o.fulfillment_id === fulfillmentId)?.fulfillment?.pick_up;
    return delay(p ?? { fulfillment_id: fulfillmentId } as PickUp);
  },
  create: (body: object) => delay({ fulfillment_id: 99, ...body } as PickUp),
  update: (fulfillmentId: number, body: object) => delay({ fulfillment_id: fulfillmentId, ...body } as PickUp),
};

export const mockRidersApi = {
    list: () => delay(mockRiders),
    get: (id: number) => delay(mockRiders.find((r) => r.rider_id === id) ?? mockRiders[0]),
    create: (body: object) => delay({ ...mockRiders[0], ...body, rider_id: 99 }),
    update: (id: number, body: object) => delay({ ...mockRiders[0], ...body }),
    updateLocation: (id: number, location: string) =>
        delay({ ...(mockRiders.find((r) => r.rider_id === id) ?? mockRiders[0]), current_location: location }),
};