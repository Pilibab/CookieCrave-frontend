"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { ordersApi, customersApi, fulfillmentApi } from "@/lib/api";
import Link from "next/link";
// Added Customer and Fulfillment type imports to represent the complete form
import type { OrderStatus, Order, Customer, Fulfillment } from "@/types/mytypes";

const ITEMS_PER_PAGE = 20;

// 1. Create a fallback-safe type that allows both raw and populated forms
type HydratedOrder = Order & {
  customer?: Customer | null;
  fulfillment?: Fulfillment | null;
};

const STATUSES: OrderStatus[] = [
  "Pending", "Confirmed", "Baking", "Out for Delivery", "For Pickup", "Completed", "Cancelled"
];

const statusBadge: Record<OrderStatus, { bg: string; color: string }> = {
  Pending:            { bg: "#fef9c3", color: "#854d0e" },
  Confirmed:          { bg: "#e0e7ff", color: "#3730a3" },
  Baking:             { bg: "#dbeafe", color: "#1e3a8a" },
  "Out for Delivery": { bg: "#e0f2fe", color: "#0c4a6e" },
  "For Pickup":       { bg: "#f3e8ff", color: "#581c87" },
  Completed:          { bg: "#dcfce7", color: "#14532d" },
  Cancelled:          { bg: "#fee2e2", color: "#7f1d1d" },
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // 2. Pass our custom type into useFetch so TypeScript expects the hydrated fields
  const { data: rawOrders, loading, error } = useFetch<HydratedOrder[]>(
    async () => {
      const baseOrders = await ordersApi.list();

      return Promise.all(
        baseOrders.map(async (order) => {
          try {
            const [customerData, fulfillmentData] = await Promise.all([
              customersApi.get(String(order.cust_id)).catch(() => null),
              fulfillmentApi.get(order.fulfillment_id).catch(() => null),
            ]);

            return {
              ...order,
              // ord_f_type: fulfillmentData?.fulfillment_type,
              customer: customerData,
              fulfillment: fulfillmentData,
            };
          } catch (err) {
            console.error(`Failed to hydrate details for order #${order.ord_id}:`, err);
            return order; // Fallback: returns the raw order without relations if an API fails
          }
        })
      );
    },
    []
  );

  const allOrders = rawOrders ?? [];

  const filteredOrders = statusFilter
    ? allOrders.filter((order) => order.order_status === statusFilter)
    : allOrders;

  const total = filteredOrders.length;
  const orders = filteredOrders.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="page-body">
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <Link href="/orders/new" className="btn btn-primary">+ New Order</Link>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          className={`btn ${statusFilter === "" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => { setStatusFilter(""); setPage(1); }}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`btn ${statusFilter === s ? "btn-primary" : "btn-secondary"}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="card">
        {loading && <div className="spinner" />}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {!loading && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date & Time</th>
                    <th>Fulfillment</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <p>No orders found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const badge = statusBadge[order.order_status] ?? { bg: "#f3f4f6", color: "#374151" };
                      return (
                        <tr key={order.ord_id}>
                          <td style={{ fontWeight: 600 }}>#{order.ord_id}</td>
                          <td>
                            {/* 3. The fallback is safely handled here. If customer is undefined/null, it shows the ID */}
                            {order.customer ? (
                              `${order.customer.cust_firstname} ${order.customer.cust_lastname}`
                            ) : (
                              `Customer #${String(order.cust_id).slice(0, 8)}`
                            )}
                          </td>
                          <td style={{ fontSize: 13, color: "#6b6f8a" }}>
                            {new Date(order.ord_time).toLocaleString("en-PH", {
                              month: "short", day: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </td>
                          <td>{order.fulfillment?.fulfillment_type ?? order.fulfillment?.fulfillment_type ?? "—"}</td>
                          <td>{order.ord_pay_meth}</td>
                          <td style={{ fontWeight: 600 }}>
                            ₱{Number(order.total_amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                fontSize: 11,
                                padding: "3px 10px",
                                background: badge.bg,
                                color: badge.color,
                                fontWeight: 600,
                              }}
                            >
                              {order.order_status}
                            </span>
                          </td>
                          <td>
                            <Link
                              href={`/orders/${order.ord_id}`}
                              style={{ color: "#c8883a", fontSize: 13, fontWeight: 600 }}
                            >
                              View →
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {total > ITEMS_PER_PAGE && (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  className="btn btn-secondary"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span style={{ lineHeight: "36px", fontSize: 13, color: "#6b6f8a" }}>
                  Page {page} of {Math.ceil(total / ITEMS_PER_PAGE)}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={page * ITEMS_PER_PAGE >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}