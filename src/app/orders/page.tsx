"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { ordersApi } from "@/lib/api";
import Link from "next/link";
import type { OrderStatus } from "@/types";

const STATUSES: OrderStatus[] = ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"];

// Map display labels to actual API statuses
const STATUS_MAP: Record<string, string> = {
  "Pending": "Pending",
  "Preparing": "Baking",
  "Ready": "For Pickup",
  "Delivered": "Out for Delivery",
  "Cancelled": "Cancelled",
};

const statusBadge: Record<string, string> = {
  Pending:            "badge-pending",
  Confirmed:          "badge-confirmed",
  Baking:             "badge-baking",
  "Out for Delivery": "badge-delivery",
  "For Pickup":       "badge-pickup",
  Completed:          "badge-completed",
  Cancelled:          "badge-cancelled",
};

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const apiStatus = activeFilter === "All" ? undefined : STATUS_MAP[activeFilter] ?? activeFilter;

  const { data, loading, error } = useFetch(
    () => ordersApi.list(page, 20, apiStatus),
    [page, activeFilter]
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: "var(--navy)" }}>Orders</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {data?.total ?? 0} orders • {data?.data.filter(o => o.order_status === "Baking" || o.order_status === "Confirmed").length ?? 0} active
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Search */}
          <div className="search-bar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              placeholder="Search orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Link href="/orders/new" className="btn btn-primary" style={{ lineHeight: 1. }}>+ New Order</Link>
        </div>
      </div>

      {/* Status filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {["All", ...STATUSES].map((s) => (
          <button
            key={s}
            className={`status-btn${activeFilter === s ? " active" : ""}`}
            onClick={() => { setActiveFilter(s); setPage(1); }}
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
                        <div className="empty-state"><p>No orders found</p></div>
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
                        <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
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
                          <span className={`badge ${statusBadge[order.order_status] ?? "badge-pending"}`}>
                            {order.order_status}
                          </span>
                        </td>
                        <td>
                          <Link
                            href={`/orders/${order.order_id}`}
                            style={{ color: "var(--navy)", fontSize: 12, fontWeight: 600 }}
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

            {data.total > 20 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ lineHeight: "36px", fontSize: 12, color: "var(--text-muted)" }}>
                  Page {page} of {Math.ceil(data.total / 20)}
                </span>
                <button className="btn btn-secondary" disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
