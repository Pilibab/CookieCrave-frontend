"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import Link from "next/link";
import { dashboardApi, inventoryDashboardApi } from "@/lib/adapters/dashboard.adapter";
import type { OrderStatus, Order } from "@/types";

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
  Pending:            { bg: "rgba(254, 249, 195, 0.15)", color: "#fef08a" },
  Confirmed:          { bg: "rgba(241, 245, 249, 0.1)", color: "#cbd5e1" },
  Baking:             { bg: "rgba(254, 243, 199, 0.15)", color: "#fde68a" },
  "Out for Delivery": { bg: "rgba(224, 242, 254, 0.15)", color: "#bae6fd" },
  "For Pickup":       { bg: "rgba(250, 232, 255, 0.15)", color: "#f5d0fe" },
  Completed:          { bg: "rgba(220, 252, 231, 0.12)", color: "#bbf7d0" },
  Cancelled:          { bg: "rgba(254, 226, 226, 0.12)", color: "#fecaca" },
};

export default function DashboardAndOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);

  const { data: summary, loading: sumLoading } = useFetch(() => dashboardApi.weeklySummary());
  const { data: lowStock } = useFetch(inventoryDashboardApi.lowStock);
  const { data: paginatedData, loading: ordersLoading, error } = useFetch(
    () => dashboardApi.pendingOrders(page, 5, statusFilter || undefined),
    [page, statusFilter]
  );

  const orders: Order[] = paginatedData?.data ?? [];
  const total: number = paginatedData?.total ?? 0;

  return (
    <div style={containerStyle}>
      {/* Immersive high-visibility asset background */}
      <div style={backgroundWrapperStyle} />
      <div style={luxuryScrimOverlayStyle} />

      <div style={contentWrapperStyle}>
        
        {/* Sleek Low-Profile Header */}
        <header style={headerContainerStyle}>
          <div>
            <h1 style={titleStyle}>Dashboard</h1>
            <p style={subtitleStyle}>Real-time commercial storefront operations matrix.</p>
          </div>
          <Link href="/orders/new" style={primaryBtnStyle}>
            + New Order
          </Link>
        </header>

        {/* Ultra-Compact Horizontal Stat Ribbon */}
        <section style={metricsGridStyle}>
          <div style={compactGlassCardStyle}>
            <span style={cardLabelStyle}>Weekly Volume</span>
            <div style={cardValueStyle}>{sumLoading ? "—" : summary?.total_orders ?? 0}</div>
          </div>

          <div style={compactGlassCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", width: "100%" }}>
              <span style={cardLabelStyle}>Fulfilled</span>
              <Link href="/orders?status=Completed" style={inlineLinkStyle}>Ledger →</Link>
            </div>
            <div style={cardValueStyle}>{sumLoading ? "—" : summary?.completed_orders ?? 0}</div>
          </div>

          <div style={compactGlassCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", width: "100%" }}>
              <span style={cardLabelStyle}>Gross Revenue</span>
              <Link href="/reports" style={inlineLinkStyle}>Audit →</Link>
            </div>
            <div style={{ ...cardValueStyle, color: "#fef08a" }}>
              {sumLoading ? "—" : `₱${Number(summary?.total_revenue ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
            </div>
          </div>

          <div style={compactGlassCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", width: "100%" }}>
              <span style={cardLabelStyle}>Shortages</span>
              <Link href="/inventory" style={inlineLinkStyle}>Restock →</Link>
            </div>
            <div style={{ ...cardValueStyle, color: lowStock && lowStock.length > 0 ? "#fca5a5" : "#FFFFFF" }}>
              {lowStock?.length ?? 0}
            </div>
          </div>
        </section>

        {/* Streamlined Clean Workspace Panel */}
        <main style={mainGlassPanelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>Order Stream</h2>
            
            {/* Minimalist Micro-Tab Filter Rail */}
            <div style={filterBarStyle}>
              <button
                style={statusFilter === "" ? activeFilterBtnStyle : inactiveFilterBtnStyle}
                onClick={() => { setStatusFilter(""); setPage(1); }}
              >
                All Streams
              </button>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  style={statusFilter === s ? activeFilterBtnStyle : inactiveFilterBtnStyle}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* High-Density Grid Views */}
          {ordersLoading && (
            <div style={statusMessageStyle}>Syncing logs...</div>
          )}
          
          {error && (
            <div style={{ ...statusMessageStyle, color: "#fca5a5" }}>
              Data layer fault: {error}
            </div>
          )}
          
          {!ordersLoading && !error && (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderRowStyle}>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Client</th>
                      <th style={thStyle}>Dispatch Target</th>
                      <th style={thStyle}>Fulfillment</th>
                      <th style={thStyle}>Settlement</th>
                      <th style={thStyle}>Gross</th>
                      <th style={thStyle}>Status</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={emptyTableStyle}>
                          No operational streams detected.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const badge = statusBadge[order.order_status] ?? { bg: "rgba(255,255,255,0.05)", color: "#fff" };
                        return (
                          <tr key={order.order_id} style={tableRowStyle}>
                            <td style={{ ...tdStyle, fontWeight: 700, color: "#C8883A" }}>
                              #{order.order_id}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>
                              {order.customer
                                ? `${order.customer.cust_firstname} ${order.customer.cust_lastname}`
                                : `Client Profile ID...${String(order.customer_id).slice(-4)}`}
                            </td>
                            <td style={{ ...tdStyle, color: "#94a3b8" }}>
                              {new Date(order.order_time).toLocaleString("en-PH", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                              })}
                            </td>
                            <td style={tdStyle}>{order.fulfillment?.fulfillment_type ?? order.ord_f_type ?? "—"}</td>
                            <td style={{ ...tdStyle, color: "#64748b" }}>{order.payment_method ?? "Cash"}</td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: "#FFFFFF" }}>
                              ₱{Number(order.total_amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </td>
                            <td style={tdStyle}>
                              <span style={{
                                fontSize: "10px",
                                padding: "3px 8px",
                                backgroundColor: badge.bg,
                                color: badge.color,
                                fontWeight: 700,
                                borderRadius: "3px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                border: `1px solid ${badge.color}22`
                              }}>
                                {order.order_status}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                              <Link href={`/orders/${order.order_id}`} style={actionLinkStyle}>
                                Inspect →
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Compressed Pagination bar */}
              {total > 5 && (
                <div style={paginationRowStyle}>
                  <span style={paginationInfoStyle}>
                    Page {page} of {Math.ceil(total / 5)}
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      style={page === 1 ? disablePagingBtnStyle : pagingBtnStyle} 
                      disabled={page === 1} 
                      onClick={() => setPage((p) => p - 1)}
                    >
                      ←
                    </button>
                    <button 
                      style={page * 5 >= total ? disablePagingBtnStyle : pagingBtnStyle} 
                      disabled={page * 5 >= total} 
                      onClick={() => setPage((p) => p + 1)}
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ─── ULTRA-COMPACT EXECUTIVE STYLES ─── */
const containerStyle: React.CSSProperties = {
  position: "relative",
  minHeight: "calc(100vh - var(--navbar-h, 60px))",
  overflowY: "auto",
  padding: "24px 32px",
  backgroundColor: "#080605",
  fontFamily: "system-ui, -apple-system, sans-serif",
  color: "#FFFFFF"
};

const backgroundWrapperStyle: React.CSSProperties = {
  position: "fixed",
  top: "var(--navbar-h, 60px)",
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: "url('/dashboard-bg.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  opacity: 1.0, 
  zIndex: 0,
  pointerEvents: "none"
};

const luxuryScrimOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: "var(--navbar-h, 60px)",
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(8, 6, 5, 0.7)", 
  zIndex: 1,
  pointerEvents: "none"
};

const contentWrapperStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  maxWidth: "1340px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "20px"
};

const headerContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "26px",
  fontWeight: "normal",
  fontFamily: "Georgia, serif", 
  color: "#FFFFFF",
};

const subtitleStyle: React.CSSProperties = {
  margin: "2px 0 0 0",
  fontSize: "12px",
  color: "#64748b",
};

const primaryBtnStyle: React.CSSProperties = {
  backgroundColor: "#C8883A", 
  color: "#FFFFFF",
  padding: "8px 16px",
  borderRadius: "4px",
  fontWeight: 600,
  fontSize: "12px",
  textDecoration: "none",
  boxShadow: "0 4px 12px rgba(200, 136, 58, 0.15)",
};

const metricsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px"
};

const compactGlassCardStyle: React.CSSProperties = {
  backgroundColor: "rgba(20, 18, 16, 0.75)",
  backdropFilter: "blur(12px)", 
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "4px",
  padding: "14px 18px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const cardValueStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "normal",
  fontFamily: "Georgia, serif",
  color: "#FFFFFF",
  marginTop: "4px"
};

const inlineLinkStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "#C8883A",
  textDecoration: "none",
};

const mainGlassPanelStyle: React.CSSProperties = {
  backgroundColor: "rgba(20, 18, 16, 0.82)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "6px",
  padding: "20px 24px",
  boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
  marginBottom: "16px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  paddingBottom: "12px"
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "16px",
  fontWeight: "normal",
  fontFamily: "Georgia, serif",
  color: "#FFFFFF"
};

const filterBarStyle: React.CSSProperties = {
  display: "flex",
  gap: "4px",
  flexWrap: "wrap",
};

const activeFilterBtnStyle: React.CSSProperties = {
  backgroundColor: "rgba(200, 136, 58, 0.12)",
  color: "#C8883A",
  border: "1px solid rgba(200, 136, 58, 0.4)",
  padding: "4px 10px",
  borderRadius: "3px",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

const inactiveFilterBtnStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#64748b",
  border: "1px solid transparent",
  padding: "4px 10px",
  borderRadius: "3px",
  fontSize: "11px",
  fontWeight: 500,
  cursor: "pointer",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left"
};

const tableHeaderRowStyle: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.08)"
};

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: "10px",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.03)"
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  fontSize: "13px",
  color: "#cbd5e1"
};

const actionLinkStyle: React.CSSProperties = {
  color: "#C8883A",
  fontSize: "12px",
  fontWeight: 600,
  textDecoration: "none",
};

const emptyTableStyle: React.CSSProperties = {
  padding: "24px",
  textAlign: "center",
  color: "#64748b",
  fontSize: "13px",
  fontStyle: "italic"
};

const paginationRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "16px",
};

const paginationInfoStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#64748b"
};

const pagingBtnStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#FFFFFF",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "4px 12px",
  borderRadius: "3px",
  fontSize: "12px",
  cursor: "pointer",
};

const disablePagingBtnStyle: React.CSSProperties = {
  ...pagingBtnStyle,
  color: "rgba(255,255,255,0.15)",
  borderColor: "rgba(255,255,255,0.03)",
  cursor: "not-allowed"
};

const statusMessageStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "24px",
  fontSize: "13px",
  color: "#64748b"
};