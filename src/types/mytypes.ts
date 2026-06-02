
// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: "admin" | "customer";
}
// ─── Staff ────────────────────────────────────────────────────────────────
export interface Staff {
  staff_id: string ;
  staff_name: string;
  staff_email: string;
  role: "admin"|"manager"|"baker";
}
export interface GCashPayment {
  order_id: string;
  reference_no: string;
  amount: number;
  paid_at: Date;
}
// ─── Customer ────────────────────────────────────────────────────────────────
export interface Customer {
  cust_id: string;
  cust_lastname: string;
  cust_firstname: string;
  cust_middlename?: string;
  cust_email: string;
  cust_cont_no?: string;
  cust_cd: string;
  cust_social_provider: "google"
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  prod_id: number;
  prod_name: string;
  prod_desc?: string;
  prod_price: number;
  prod_available: boolean;
  prod_sl: string;
  prod_image_url: string;
}



// ─── BOM ─────────────────────────────────────────────────────────────────────
export interface BOMEntry {
  bom_id: number;
  prod_id: number;
  inv_id: number;
  bom_quan_req: number;
}

// ─── Fulfillment ─────────────────────────────────────────────────────────────
export type FulfillmentType = "Delivery" | "Pick_Up";

export interface Fulfillment {
  fulfillment_id: number;
  fulfillment_type: FulfillmentType;
}

export interface Delivery {
  fulfillment_id: number;
  rider_id?: string;
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
  rider_id: string;
  rider_name: string;
  rider_contact_num?: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────
// mytypes.ts
export type PaymentMethod = "Cash" | "GCash";
export type OrderStatus = "Pending"| "Confirmed"| "Baking"| "Out for Delivery"| "For Pickup"| "Completed"| "Cancelled";

export interface Order {
  ord_id: number;
  cust_id: string;
  fulfillment_id: number;
  ord_time: Date;
  total_amount: number;
  ord_fulfillment_time: Date;
  ord_pay_meth: PaymentMethod;
  order_status: OrderStatus;

}

// ─── Cart / Order Line Item ──────────────────────────────────────────────────
export interface CartOrderLineItem {
  ord_id: number;
  prod_id: number;
  cart_quan: number;
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

// ─── Inventory ───────────────────────────────────────────────────────────────
// mytypes.ts
export interface InventoryItem {
  inv_id: number;
  inv_ing_name: string;
  inv_stock: number;
  inv_uom: string;
  inv_rt: number;
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