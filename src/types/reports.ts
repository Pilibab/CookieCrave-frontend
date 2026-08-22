import { OrderStatus } from "./order";


// ─── Reports / Aggregates ────────────────────────────────────────────────────
export interface WeeklySummary {
    week_start: string;
    week_end: string;
    total_orders: number;
    completed_orders: number;
    total_revenue: number;
    orders_by_status: Record<OrderStatus, number>;
}

