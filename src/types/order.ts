// ─── Order ───────────────────────────────────────────────────────────────────
// mytypes.ts
export type PaymentMethod = "Cash" | "GCash";
export type OrderStatus =
    | "Pending"
    | "Confirmed"
    | "Baking"
    | "Out for Delivery"
    | "For Pickup"
    | "Completed"
    | "Cancelled";

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