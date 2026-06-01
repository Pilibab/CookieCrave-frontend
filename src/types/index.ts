// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: "admin" | "customer";
}

// ─── Customer ────────────────────────────────────────────────────────────────
export interface Customer {
  cust_id: string; // Backend expects UUID string
  cust_firstname: string;
  cust_lastname: string;
  cust_middlename?: string;
  cust_email: string;
  cust_social_provider?: string;
  cust_cont_no?: string;
  cust_cd: string; // Timestamp
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  prod_id: number;
  prod_name: string;
  prod_desc?: string;
  prod_price: number;
  prod_available: boolean;
  shelf_life?: string; // Kept optional client-side if handled dynamically
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export interface InventoryItem {
  inv_id: number;
  inv_ing_name: string;
  inv_stock: number;
  inv_uom: string; // e.g., "pcs"
  inv_rt: number;  // Reorder Trigger point
}

// ─── BOM (Bill of Materials) ─────────────────────────────────────────────────
export interface BOMEntry {
  bom_id: number;
  prod_id: number;
  inv_id: number;
  bom_quan_req: number;
  product?: Product;
  inventory?: InventoryItem;
}

// ─── Fulfillment ─────────────────────────────────────────────────────────────
export type FulfillmentType = "Delivery" | "Pick_Up";

export interface Fulfillment {
  fulfillment_id: number;
  fulfillment_type: FulfillmentType; // "Delivery" or "Pick_Up"
  delivery?: Delivery;
  pick_up?: PickUp;
}

export interface Delivery {
  fulfillment_id: number;
  rider_id?: number;
  address: string;
  contact_name?: string;
  contact_number?: string;
  note?: string;
  floor_unit_num?: string;
}

export interface PickUp {
  fulfillment_id: number;
  preferred_time?: string;
  pick_up_location?: string;
}

// ─── Rider ───────────────────────────────────────────────────────────────────
export interface Rider {
  rider_id: number;
  rider_name: string;
  rider_contact_num?: string;
  current_location?: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type PaymentMethod = "Cash" | "GCash";
export type OrderStatus = "Pending" | "Confirmed" | "Baking" | "Out for Delivery" | "For Pickup" | "Completed" | "Cancelled";

export interface Order {
  order_id: number;
  cust_id: string;       // Synced to look up the customer UUID string
  fulfillment_id: number;
  total_amount: number;
  ord_pay_meth: string;  // Matches backend schema name
  ord_f_type: string;    // Matches backend schema fulfillment type label
  prod_ids: number[];    // Backend expects an array of numbers representing item IDs
  reference_no?: string; // String tracker for tracking references
  order_time: string;
  order_status: OrderStatus;
  customer?: Customer;
  fulfillment?: Fulfillment;
  cart_items?: CartOrderLineItem[];
  invoice?: Invoice;
}

// ─── Cart / Order Line Item ──────────────────────────────────────────────────
export interface CartOrderLineItem {
  order_id: number;
  prod_id: number;
  quantity: number;
  price_per_item: number;
  product?: Product;
}

// ─── Invoice ─────────────────────────────────────────────────────────────────
export interface Invoice {
  invoice_id: number;
  order_id: number;
  invoice_date: string;
  order?: Order;
}

// ─── Reports / Aggregates ────────────────────────────────────────────────────
export interface WeeklySummary {
  week_start: string;
  week_end: string;
  total_orders: number;
  completed_orders: number;
  total_revenue: number;
  orders_by_status: Record<OrderStatus, number>;
}

export interface LowStockItem extends InventoryItem {
  is_low: boolean;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}