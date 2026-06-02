"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import Link from "next/link";
import { dashboardApi, inventoryDashboardApi } from "@/lib/adapters/dashboard.adapter";
import type { OrderStatus, Order } from "@/types";

// Unified Statuses list accommodating both frontend and backend configurations
const STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Baking",
  "Out for Delivery",
  "For Pickup",
  "Completed",
  "Cancelled",
];

const statusBadge: Record<OrderStatus, { bg: string; color: string }> = {
  Pending:            { bg: "#fef9c3", color: "#854d0e" },
  Confirmed:          { bg: "#eef2f6", color: "#475569" },
  Baking:             { bg: "#fef3c7", color: "#d97706" },
  "Out for Delivery": { bg: "#e0f2fe", color: "#0c4a6e" },
  "For Pickup":       { bg: "#fae8ff", color: "#86198f" },
  Completed:          { bg: "#dcfce7", color: "#14532d" },
  Cancelled:          { bg: "#fee2e2", color: "#7f1d1d" },
};

// Simple inline styles fallback for missing dashboard design parameters
const s = {
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  viewAll: { color: "#c8883a", fontSize: "14px", fontWeight: 600, textDecoration: "none" },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" },
  summaryCard: { padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }
};

export default function DashboardAndOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);

  // 1. Fetch Summary Statistics through the Adapter
  const { data: summary, loading: sumLoading } = useFetch(() => dashboardApi.weeklySummary());

  // 2. Fetch Low Stock Alerts through the Adapter
  const { data: lowStock } = useFetch(inventoryDashboardApi.lowStock);

  // 3. Dynamic Server Pagination Hook listening to Adapter conversions
  const { data: paginatedData, loading: ordersLoading, error } = useFetch(
    () => dashboardApi.pendingOrders(page, 5, statusFilter || undefined),
    [page, statusFilter]
  );

  const orders: Order[] = paginatedData?.data ?? [];
  const total: number = paginatedData?.total ?? 0;

  return (
    <div className="page-body">
      
      {/* ─── WORK COMPONENT 1: WEEKLY OVERVIEW SUMMARY ─── */}
      <div className="page-header">
        <h1 className="page-title">Dashboard & Orders Management</h1>
        <Link href="/orders/new" className="btn btn-primary">+ New Order</Link>
      </div>

      {!sumLoading && summary && (
        <div style={s.summaryGrid}>
          <div style={s.summaryCard}>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Total Revenue</p>
            <h3 style={{ fontSize: 24, margin: "4px 0 0 0" }}>
              ₱{summary.total_revenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div style={s.summaryCard}>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Total Weekly Orders</p>
            <h3 style={{ fontSize: 24, margin: "4px 0 0 0" }}>{summary.total_orders}</h3>
          </div>
          <div style={s.summaryCard}>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Completed Orders</p>
            <h3 style={{ fontSize: 24, margin: "4px 0 0 0", color: "#16a34a" }}>{summary.completed_orders}</h3>
          </div>
        </div>
      )}

      {/* Status filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          className={`btn ${statusFilter === "" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => { setStatusFilter(""); setPage(1); }}
        >
          All Managed
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

      {/* ─── WORK COMPONENT 2: INTERCEPTED PAGINATED ORDERS TABLE ─── */}
      <div className="card" style={{ marginBottom: 24 }}>
        {ordersLoading && <div className="spinner" />}
        {error && <p style={{ color: "red" }}>Error Loading Data: {error}</p>}
        
        {!ordersLoading && (
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <p>No orders matched your current tracking parameters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const badge = statusBadge[order.order_status] ?? { bg: "#f3f4f6", color: "#374151" };
                      return (
                        <tr key={order.order_id}>
                          <td style={{ fontWeight: 600 }}>#{order.order_id}</td>
                          <td>
                            {order.customer
                              ? `${order.customer.cust_firstname} ${order.customer.cust_lastname}`
                              : `Customer #${String(order.customer_id).slice(0, 8)}`}
                          </td>
                          <td style={{ fontSize: 13, color: "#6b6f8a" }}>
                            {new Date(order.order_time).toLocaleString("en-PH", {
                              month: "short", day: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </td>
                          <td>{order.fulfillment?.fulfillment_type ?? order.ord_f_type ?? "—"}</td>
                          <td>{order.payment_method ?? "Cash"}</td>
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
                                borderRadius: "4px"
                              }}
                            >
                              {order.order_status}
                            </span>
                          </td>
                          <td>
                            <Link
                              href={`/orders/${order.order_id}`}
                              style={{ color: "#c8883a", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
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

            {/* Pagination Controls */}
            {total > 5 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  className="btn btn-secondary"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span style={{ lineHeight: "36px", fontSize: 13, color: "#6b6f8a" }}>
                  Page {page} of {Math.ceil(total / 5)}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={page * 5 >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── WORK COMPONENT 3: LOW STOCK METRIC SECTION ─── */}
      <div className="card">
        <div style={s.cardHeader}>
          <h3 style={{ fontSize: 16, margin: 0 }}>Low Stock Alerts</h3>
          <Link href="/inventory" style={s.viewAll}>View all →</Link>
        </div>
        {!lowStock || lowStock.length === 0 ? (
          <p style={{ color: "#27ae60", fontSize: 14, padding: "16px 0", margin: 0 }}>✓ All ingredient stock levels nominal.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Stock</th>
                  <th>Unit</th>
                  <th>Reorder At</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.inventory_id}>
                    <td style={{ fontWeight: 500 }}>{item.ingredients_name}</td>
                    <td style={{ color: "#c0392b", fontWeight: 600 }}>{item.current_stock}</td>
                    <td>{item.unit_of_measure}</td>
                    <td style={{ color: "#6b6f8a" }}>{item.recorder_trigger}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}