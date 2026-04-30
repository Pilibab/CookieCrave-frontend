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
  customer_id: number;
  last_name: string;
  given_name: string;
  middle_name?: string;
  suffix?: string;
  email: string;
  contact_num?: string;
  created_at: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  product_id: number;
  product_name: string;
  product_description?: string;
  price: number;
  is_available: boolean;
  shelf_life?: string;
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export interface InventoryItem {
  inventory_id: number;
  ingredients_name: string;
  current_stock: number;
  unit_of_measure: string;
  recorder_trigger: number;
}

// ─── BOM ─────────────────────────────────────────────────────────────────────
export interface BOMEntry {
  bom_id: number;
  product_id: number;
  inventory_id: number;
  quantity_required: number;
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
export type PaymentMethod = "Cash" | "GCash";
export type OrderStatus = "Pending" | "Confirmed" | "Baking" | "Out for Delivery" | "For Pickup" | "Completed" | "Cancelled";

export interface Order {
  order_id: number;
  customer_id: number;
  fulfillment_id: number;
  order_time: string;
  total_amount: number;
  payment_method: PaymentMethod;
  order_status: OrderStatus;
  customer?: Customer;
  fulfillment?: Fulfillment;
  cart_items?: CartOrderLineItem[];
  invoice?: Invoice;
}

// ─── Cart / Order Line Item ──────────────────────────────────────────────────
export interface CartOrderLineItem {
  order_id: number;
  product_id: number;
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
