// lib/adapters/dashboard.adapter.ts
import { ordersApi, reportsApi, inventoryApi, customersApi, fulfillmentApi, cartApi, productsApi} from "@/lib/api";
import type { Order as FrontendOrder, WeeklySummary, CartOrderLineItem as FrontendCart } from "@/types/index";
// 1. Import backend structures explicitly using aliases to prevent the naming collision
import type { 
    Order as BackendOrder, 
    InventoryItem as BackendInventoryItem, CartOrderLineItem as BackendCart,
    Product as Fproduct
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
        ord_f_type: "",

        // Provide defaults for frontend extensions not present in raw order table rows
        customer: undefined,
        fulfillment: undefined,
        cart_items: []
    };
}

// A wrapper function to fetch the order and hydrate the customer field
async function fetchAndAdaptOrder(raw: BackendOrder): Promise<FrontendOrder> {
    // First, map the basic fields synchronously
    const order = adaptOrder(raw); 

    try {
        // Note: customersApi.get expects a string. 
        // If raw.cust_id is a number, we cast it to a string using String()
        const customerInfo = await customersApi.get(String(raw.cust_id));
        const fulfillmentInfo = await fulfillmentApi.get(raw.fulfillment_id)
        const cartInfo = await cartApi.getByOrder(raw.ord_id)

        
        // Inject the customer data into the order
        order.customer = customerInfo; 
        order.fulfillment = fulfillmentInfo; 
        order.ord_f_type = fulfillmentInfo.fulfillment_type
        order.cart_items = await shapeCartLine(raw.ord_id, cartInfo); 

    } catch (error) {
        console.error(`Failed to fetch customer data for ID ${raw.cust_id}:`, error);
        // Leave order.customer as undefined (or handle fallback)
    }

    return order;
}
async function shapeCartLine(order_id: number, cartline: BackendCart[]): Promise<FrontendCart[]> {
    
    return Promise.all(
        cartline.map(async (v) => { // Added 'async' here!
            const prod_id = v.prod_id;
            
            // Now TypeScript knows prod_info is exactly of type 'Product'
            const prod_info  = await productsApi.get(prod_id); 
            const price = prod_info.prod_price; // Autocomplete will work perfectly here!
            
            return {
                order_id: order_id,             // Fixed: Use commas, not semicolons
                product_id: prod_id,
                quantity: v.cart_quan || 1,           // Fixed: Replace type hint with actual value from 'v'
                price_per_item: price,          // Fixed: Assigned the variable we just fetched                
                product: {
                    product_id: prod_info.prod_id,
                    product_name: prod_info.prod_name,
                    product_description: prod_info.prod_desc || "",
                    price: prod_info.prod_price,
                    is_available: prod_info.prod_available !== undefined ? prod_info.prod_available : true,
                    shelf_life: (prod_info as any).prod_sl ? String((prod_info as any).prod_sl) : "",
                    image: (prod_info as any).prod_image_url || ""
                }
            };
        })
    );
}

export async function fetchPendingOrders(
    page = 1, 
    limit = 5, 
    statusFilter?: string
): Promise<PaginatedOrders> {
    const raw = await ordersApi.list();
    
    // Explicitly cast raw incoming data as your BackendOrder array
    const ordersArray = raw

    // FILTER STEP: Filter by statusFilter parameter if provided; default to "Pending" if empty
    const filteredRaw = statusFilter 
        ? ordersArray.filter((o) => o.order_status === statusFilter)
        : ordersArray.filter((o) => o.order_status === "Pending");
    
    // Convert BackendOrder[] -> FrontendOrder[]
    const adaptedOrders = filteredRaw.map(adaptOrder);
    
    const start = (page - 1) * limit;
    return {
        data: adaptedOrders.slice(start, start + limit),
        total: adaptedOrders.length,
        page,
        limit,
    };
}

// Update export object declaration structure inside the file
export const dashboardApi = {
    pendingOrders: (page = 1, limit = 5, statusFilter?: string) => fetchPendingOrders(page, limit, statusFilter),
    weeklySummary: (weekStart?: string) => fetchWeeklySummary(weekStart),
};

export async function fetchWeeklySummary(weekStart?: string): Promise<WeeklySummary> {
    const raw = await reportsApi.weeklySummary(weekStart);
    return {
        ...raw,
        total_revenue: Number(raw.total_revenue),
    };
}





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