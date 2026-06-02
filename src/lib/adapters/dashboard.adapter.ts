// lib/adapters/dashboard.adapter.ts
import { ordersApi, reportsApi, inventoryApi } from "@/lib/api";
import type { Order as FrontendOrder, WeeklySummary } from "@/types/index";

// 1. Import backend structures explicitly using aliases to prevent the naming collision
import type { 
  Order as BackendOrder, 
  InventoryItem as BackendInventoryItem 
} from "@/types/mytypes";

export interface PaginatedOrders {
    data: FrontendOrder[]; // Must contain frontend properties (order_id, etc.)
    total: number;
    page: number;
    limit: number;
}

// 2. Write the structural translation function for Orders
function adaptOrder(raw: BackendOrder): FrontendOrder {
    return {
        order_id: raw.ord_id,                  // ord_id -> order_id
        customer_id: raw.cust_id,              // cust_id -> customer_id
        fulfillment_id: raw.fulfillment_id,
        order_time: raw.ord_time.toString(),   // Date -> string
        total_amount: raw.total_amount,
        payment_method: raw.ord_pay_meth,      // ord_pay_meth -> payment_method
        order_status: raw.order_status,
        // Provide defaults for frontend extensions not present in raw order table rows
        customer: undefined,
        fulfillment: undefined,
        cart_items: []
    };
}

export async function fetchPendingOrders(page = 1, limit = 5): Promise<PaginatedOrders> {
    const raw = await ordersApi.list();
    
    // Explicitly cast raw incoming data as your BackendOrder array
    const ordersArray = (Array.isArray(raw) ? raw : raw?.data) as BackendOrder[];

    // Filter using your data matching logic
    const pendingRaw = ordersArray.filter((o) => o.order_status === "Pending");
    
    // 3. ✅ RUN THE TRANSLATION! Maps BackendOrder[] -> FrontendOrder[]
    const pendingAdapted = pendingRaw.map(adaptOrder);
    
    const start = (page - 1) * limit;
    return {
        data: pendingAdapted.slice(start, start + limit),
        total: pendingAdapted.length,
        page,
        limit,
    };
}

export async function fetchWeeklySummary(weekStart?: string): Promise<WeeklySummary> {
    const raw = await reportsApi.weeklySummary(weekStart);
    return {
        ...raw,
        total_revenue: Number(raw.total_revenue),
    };
}

export const dashboardApi = {
    pendingOrders: (page = 1, limit = 5) => fetchPendingOrders(page, limit),
    weeklySummary: (weekStart?: string) => fetchWeeklySummary(weekStart),
};

// ─── Inventory adapter ────────────────────────────────────────────────────────

export interface DashboardInventoryItem {
    inventory_id: number;
    ingredients_name: string;
    current_stock: number;
    unit_of_measure: string;
    recorder_trigger: number;
    is_low: boolean;
}

function adaptInventoryItem(raw: BackendInventoryItem): DashboardInventoryItem {
    return {
        inventory_id:     raw.inv_id,
        ingredients_name: raw.inv_ing_name,
        current_stock:    raw.inv_stock,
        unit_of_measure:  raw.inv_uom,
        recorder_trigger: raw.inv_rt,
        is_low:           raw.inv_stock <= raw.inv_rt,
    };
}

export async function fetchLowStock(): Promise<DashboardInventoryItem[]> {
    const raw = await inventoryApi.list();
    return (raw as BackendInventoryItem[])
        .filter((i) => i.inv_stock <= i.inv_rt)
        .map(adaptInventoryItem);
}

export const inventoryDashboardApi = {
    lowStock: () => fetchLowStock(),
};