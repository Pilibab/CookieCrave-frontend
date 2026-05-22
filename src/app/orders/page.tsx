"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { ordersApi } from "@/lib/api";
import Link from "next/link";
import type { OrderStatus } from "@/types";

const STATUSES: OrderStatus[] = ["Pending", "Confirmed", "Baking", "Out for Delivery", "For Pickup", "Completed", "Cancelled"];

const statusBadge: Record<OrderStatus, string> = {
  Pending:           "badge-pending",
  Confirmed:         "badge-confirmed",
  Baking:            "badge-baking",
  "Out for Delivery":"badge-delivery",
  "For Pickup":      "badge-pickup",
  Completed:         "badge-completed",
  Cancelled:         "badge-cancelled",
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useFetch(
    () => ordersApi.list(page, 20, statusFilter || undefined),
    [page, statusFilter]
  );

  return (
    <div className="page-body">
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <Link href="/orders/new" className="btn btn-primary">+ New Order</Link>
      </div>

      {/* Filters */}
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
        {!loading && data && (
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
                  {data.data.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <p>No orders found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.data.map((order) => (
                      <tr key={order.order_id}>
                        <td style={{ fontWeight: 600 }}>#{order.order_id}</td>
                        <td>
                          {order.customer
                            ? `${order.customer.given_name} ${order.customer.last_name}`
                            : `Customer #${order.customer_id}`}
                        </td>
                        <td style={{ fontSize: 13, color: "#6b6f8a" }}>
                          {new Date(order.order_time).toLocaleString("en-PH", {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td>{order.fulfillment?.fulfillment_type ?? "—"}</td>
                        <td>{order.payment_method}</td>
                        <td style={{ fontWeight: 600 }}>
                          ₱{Number(order.total_amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span className={`badge ${statusBadge[order.order_status]}`}>
                            {order.order_status}
                          </span>
                        </td>
                        <td>
                          <Link
                            href={`/orders/${order.order_id}`}
                            style={{ color: "#c8883a", fontSize: 13, fontWeight: 600 }}
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.total > 20 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  className="btn btn-secondary"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Prev
                </button>
                <span style={{ lineHeight: "36px", fontSize: 13, color: "#6b6f8a" }}>
                  Page {page} of {Math.ceil(data.total / 20)}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={page * 20 >= data.total}
                  onClick={() => setPage(p => p + 1)}
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
