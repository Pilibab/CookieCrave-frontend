// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: "admin" | "customer";
}

// ─── Staff ────────────────────────────────────────────────────────────────────
export interface Staff {
  staff_id: string;
  staff_name: string;
  staff_email: string;
  role: "admin" | "manager" | "baker";
}

// ─── Customer ────────────────────────────────────────────────────────────────
// Matches backend: app/model/customer.py → Customer / CustomerBase
export interface Customer {
  cust_id: string;               // UUID from Supabase auth
  cust_firstname: string;
  cust_lastname: string;
  cust_middlename?: string | null;
  cust_email: string;
  cust_social_provider?: string | null;  // "google" | "facebook"
  cust_cont_no?: string | null;
  cust_cd: string;               // datetime ISO string (auto-set by DB)
}

// ─── Product ─────────────────────────────────────────────────────────────────
// Matches backend: app/model/products.py → Product / ProductBase
export interface Product {
  prod_id: number;
  prod_name: string;
  prod_desc?: string;
  prod_price: number;
  prod_available: boolean;
  // NOTE: no shelf_life — not in backend model
}

// ─── Inventory ───────────────────────────────────────────────────────────────
// Matches backend: app/model/inventory.py → Inventory / InventoryBase
export type UnitType = "pcs" | "ml" | "g" | "kg";

export interface InventoryItem {
  inv_id: number;
  inv_ing_name: string;
  inv_stock: number;
  inv_uom: UnitType;
  inv_rt: number;             // reorder trigger point
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
  fulfillment_type: FulfillmentType;
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
// Matches backend: app/model/order.py → Order / OrderBase
// Backend statuses: "Pending" | "Preparing" | "Out for Delivery" | "Completed" | "Cancelled"
export type PaymentMethod = "Cash" | "GCash";
export type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Out for Delivery"
  | "Completed"
  | "Cancelled";

export interface Order {
  ord_id: number;                       // PK — backend field name
  cust_id: string;                      // UUID string
  fulfillment_id?: number | null;
  total_amount: number;
  ord_pay_meth: PaymentMethod;
  ord_f_type: string;                   // fulfillment type label used on create
  order_status: OrderStatus;
  ord_time: string;                     // datetime ISO string
  ord_fulfillment_time?: string | null;
  // Joined/nested (not always present):
  customer?: Customer;
  fulfillment?: Fulfillment;
  cart_items?: CartOrderLineItem[];
}

// ─── GCash Payment ───────────────────────────────────────────────────────────
export interface GCashPayment {
  order_id: string;
  reference_no: string;
  amount: number;
  paid_at: string;
}

// ─── Cart / Order Line Item ──────────────────────────────────────────────────
export interface CartOrderLineItem {
  ord_id: number;
  prod_id: number;
  cart_quan: number;
  price_per_item?: number;
  product?: Product;
}

// ─── Reports / Aggregates ────────────────────────────────────────────────────
// Matches backend: app/model/report.py → WeeklySummary
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