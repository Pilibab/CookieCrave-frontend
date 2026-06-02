"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import Link from "next/link";
import { dashboardApi, inventoryDashboardApi } from "@/lib/adapters/dashboard.adapter";
import type { OrderStatus, Order } from "@/types";

// Unified Statuses list
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

export default function DashboardAndOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);

  // 1. Fetch Summary Statistics (User's Adapter)
  const { data: summary, loading: sumLoading } = useFetch(() => dashboardApi.weeklySummary());

  // 2. Fetch Low Stock Alerts (User's Adapter)
  const { data: lowStock } = useFetch(inventoryDashboardApi.lowStock);

  // 3. Dynamic Server Pagination Hook (User's Adapter)
  const { data: paginatedData, loading: ordersLoading, error } = useFetch(
    () => dashboardApi.pendingOrders(page, 5, statusFilter || undefined),
    [page, statusFilter]
  );

  const orders: Order[] = paginatedData?.data ?? [];
  const total: number = paginatedData?.total ?? 0;

  return (
    <div style={{
      position: "relative",
      minHeight: "calc(100vh - var(--navbar-h, 60px))",
      // Changed from overflow: "hidden" to allow scrolling for the large table
      overflowY: "auto", 
      paddingBottom: "40px"
    }}>
      {/* ─── GROUP MATE'S BACKGROUND ─── */}
      <div style={{
        position: "fixed",
        top: "var(--navbar-h, 60px)",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: "url('/dashboard-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundColor: "#c8a882",
        zIndex: 0,
      }} />

      {/* ─── GROUP MATE'S LOGO (Right Half) ─── */}
      <div style={{
        position: "fixed", // Changed to fixed so it stays put when scrolling down the table
        right: 0,
        top: 0,
        bottom: 0,
        width: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 1,
      }}>
        <img
          src="/CKWebLogo.png"
          alt="CookieKrave"
          style={{ width: "70%", maxWidth: 380, objectFit: "contain" }}
        />
      </div>

      {/* ─── MAIN CONTENT PANEL ─── */}
      <div style={{
        position: "relative",
        zIndex: 2,
        width: "90%", // Expanded width to fit the table, overriding group mate's 52%
        maxWidth: "1200px",
        padding: "0 24px 32px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}>

        {/* ─── GROUP MATE'S HEADER ROW ─── */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: 20 }}>
          <div style={{
            background: "var(--navy, #0f172a)",
            borderRadius: "0 0 14px 14px",
            padding: "20px 28px 14px 28px",
            color: "#fff",
            fontWeight: 800,
            fontSize: 26,
            boxShadow: "0 6px 20px rgba(13,18,64,0.22)",
            lineHeight: 1,
          }}>
            Dashboard
          </div>

          <div style={{
            background: "rgba(255,255,255,0.93)",
            backdropFilter: "blur(8px)",
            borderRadius: 999,
            padding: "11px 28px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 3px 10px rgba(13,18,64,0.13)",
          }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--navy, #0f172a)" }}>
              {sumLoading ? "—" : summary?.total_orders ?? 0}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted, #64748b)", fontWeight: 600 }}>
              Total Orders this week
            </span>
          </div>
        </div>

        {/* ─── GROUP MATE'S METRICS CARDS ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, maxWidth: "800px" }}>
          <div style={metricCard}>
            <div style={metricVal}>{sumLoading ? "—" : summary?.completed_orders ?? 0}</div>
            <div style={metricLabel}>Fulfilled Orders</div>
            <Link href="/orders?status=Completed">
              <button className="btn btn-secondary" style={{ marginTop: 12, fontSize: 12, padding: "4px 8px" }}>View</button>
            </Link>
          </div>

          <div style={metricCard}>
            <div style={{ ...metricVal, fontSize: 20 }}>
              {sumLoading ? "—" : `₱${Number(summary?.total_revenue ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
            </div>
            <div style={metricLabel}>Weekly Revenue</div>
            <Link href="/reports">
              <button className="btn btn-secondary" style={{ marginTop: 12, fontSize: 12, padding: "4px 8px" }}>View</button>
            </Link>
          </div>

          <div style={metricCard}>
            <div style={{ ...metricVal, color: lowStock && lowStock.length > 0 ? "#c0392b" : "var(--navy, #0f172a)" }}>
              {lowStock?.length ?? 0}
            </div>
            <div style={metricLabel}>Low Stock Items</div>
            <Link href="/inventory">
              <button className="btn btn-secondary" style={{ marginTop: 12, fontSize: 12, padding: "4px 8px" }}>View</button>
            </Link>
          </div>
        </div>

        {/* ─── USER'S DETAILED ORDER TABLE ─── */}
        <div style={{ background: "rgba(255,255,255,0.95)", padding: 24, borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Order Management</h3>
            <Link href="/orders/new" className="btn btn-primary">+ New Order</Link>
          </div>

          {/* Status filters */}
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

          {ordersLoading && <div className="spinner" />}
          {error && <p style={{ color: "red" }}>Error Loading Data: {error}</p>}
          
          {!ordersLoading && (
            <>
              <div className="table-wrap" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: 12 }}>Order ID</th>
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
                        <td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                          No orders matched your current tracking parameters.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const badge = statusBadge[order.order_status] ?? { bg: "#f3f4f6", color: "#374151" };
                        return (
                          <tr key={order.order_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: 12, fontWeight: 600 }}>#{order.order_id}</td>
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
                              <span style={{
                                fontSize: 11, padding: "3px 10px", background: badge.bg,
                                color: badge.color, fontWeight: 600, borderRadius: "4px"
                              }}>
                                {order.order_status}
                              </span>
                            </td>
                            <td>
                              <Link href={`/orders/${order.order_id}`} style={{ color: "#c8883a", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
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

              {/* Pagination */}
              {total > 5 && (
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                  <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    ← Prev
                  </button>
                  <span style={{ lineHeight: "36px", fontSize: 13, color: "#6b6f8a" }}>
                    Page {page} of {Math.ceil(total / 5)}
                  </span>
                  <button className="btn btn-secondary" disabled={page * 5 >= total} onClick={() => setPage((p) => p + 1)}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Group mate's styles moved to bottom
const metricCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.93)",
  backdropFilter: "blur(8px)",
  borderRadius: 16,
  padding: "16px 18px",
  boxShadow: "0 3px 12px rgba(0,0,0,0.12)",
};
const metricVal: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: "var(--navy, #0f172a)",
};
const metricLabel: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-muted, #64748b)",
  fontWeight: 600,
  marginTop: 2,
};