"use client";

import { useFetch } from "@/hooks/useFetch";
import { ordersApi, reportsApi, inventoryApi } from "@/lib/api";
import Link from "next/link";
// Notice we are assuming your clean frontend interface file handles types cleanly now
import type { WeeklySummary, PaginatedResponse, Order, InventoryItem } from "./index"; 

export default function DashboardPage() {
  // 1. Fetching clean schemas delivered directly from the backend's new controller
  const { data: summary, loading: sumLoading } = useFetch<WeeklySummary>(reportsApi.weeklySummary);
  const { data: orders, loading: ordersLoading } = useFetch<PaginatedResponse<Order>>(() =>
    ordersApi.list(1, 5, "Pending")
  );
  const { data: lowStock } = useFetch<InventoryItem[]>(inventoryApi.lowStock);

  return (
    <div style={{
      position: "relative",
      minHeight: "calc(100vh - var(--navbar-h))",
      overflow: "hidden",
    }}>
      {/* ─── BACKGROUND IMAGE RE-SIZED TO FILL THE WHOLE PAGE WITH NO SPACES ─── */}
      <div style={{
        position: "fixed", // Changed to fixed to ensure it locks to viewport boundaries
        top: "var(--navbar-h)", // Aligns exactly where your navbar finishes
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: "url('/dashboard-bg.png')",
        backgroundSize: "100% 100%", // Forces the raw canvas to stretch over 100% width and height completely
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#c8a882",
        imageRendering: "auto",
        zIndex: 0,
      }} />

      {/* Right half: logo */}
      <div style={{
        position: "absolute",
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

      {/* ── Left content panel — full height, with left spacing ── */}
      <div style={{
        position: "relative",
        zIndex: 2,
        width: "52%",
        padding: "0 24px 32px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: "calc(100vh - var(--navbar-h))",
      }}>

        {/* Row 1: Dashboard pill + Total Orders pill */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          marginTop: 0,
        }}>
          <div style={{
            background: "var(--navy)",
            borderRadius: "0 0 14px 14px",
            padding: "20px 28px 14px 28px",
            color: "#fff",
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: "-0.3px",
            boxShadow: "0 6px 20px rgba(13,18,64,0.22)",
            lineHeight: 1,
            flexShrink: 0,
          }}>
            Dashboard
          </div>

          {/* Total Orders pill */}
          <div style={{
            background: "rgba(255,255,255,0.93)",
            backdropFilter: "blur(8px)",
            borderRadius: 999,
            padding: "11px 28px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 3px 10px rgba(13,18,64,0.13)",
            marginBottom: 0,
            alignSelf: "center",
            whiteSpace: "nowrap",
          }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)" }}>
              {sumLoading ? "—" : summary?.totalOrders ?? 0}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
              Total Orders this week
            </span>
          </div>
        </div>

        {/* Row 2: Three metric cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginLeft: 20,
          marginRight: 0,
        }}>
          <div style={metricCard}>
            <div style={metricVal}>{sumLoading ? "—" : summary?.completedOrders ?? 0}</div>
            <div style={metricLabel}>Fulfilled Orders</div>
            <Link href="/orders?status=Completed">
              <button className="view-btn" style={{ marginTop: 12 }}>View</button>
            </Link>
          </div>

          <div style={metricCard}>
            <div style={{ ...metricVal, fontSize: 16 }}>
              {sumLoading ? "—" : `₱${Number(summary?.totalRevenue ?? 0).toLocaleString("en-PH")}`}
            </div>
            <div style={metricLabel}>Weekly Revenue</div>
            <Link href="/reports">
              <button className="view-btn" style={{ marginTop: 12, background: "transparent", color: "var(--navy)", border: "1.5px solid var(--border)" }}>View</button>
            </Link>
          </div>

          <div style={metricCard}>
            <div style={{ ...metricVal, color: lowStock && lowStock.length > 0 ? "#c0392b" : "var(--navy)" }}>
              {lowStock?.length ?? 0}
            </div>
            <div style={metricLabel}>Low Stock Items</div>
            <Link href="/inventory">
              <button className="view-btn" style={{ marginTop: 12 }}>View</button>
            </Link>
          </div>
        </div>

        {/* Row 3: Pending Orders card */}
        <div style={{
          background: "rgba(255,255,255,0.93)",
          backdropFilter: "blur(8px)",
          borderRadius: 16,
          padding: "18px 20px",
          boxShadow: "0 3px 12px rgba(0,0,0,0.12)",
          marginLeft: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Pending Orders</h3>
            <Link href="/orders?status=Pending" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
              View all →
            </Link>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr 1fr 1fr",
            padding: "4px 0 8px",
            borderBottom: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--text-muted)",
            fontWeight: 600,
          }}>
            <span>Order ID</span>
            <span>Customer</span>
            <span>Amount</span>
            <span>Time</span>
          </div>

          {ordersLoading ? (
            <div className="spinner" />
          // ─── FIXED LINE 186 CRASH HERE BY ADDING EXTRA DEFENSIVE PROPERTY RUNTIME GUARDS ───
          ) : !orders || !orders.data || !orders.data.length ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "10px 0" }}>No pending orders</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {orders.data.slice(0, 3).map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div style={{
                    background: "var(--navy)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1.2fr 1fr 1fr",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}>
                    <span>#{order.id}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.customerName}
                    </span>
                    <span>₱{Number(order.totalAmount).toFixed(2)}</span>
                    <span style={{ fontSize: 11, opacity: 0.8 }}>
                      {isNaN(Date.parse(order.createdAt)) 
                        ? "—" 
                        : new Date(order.createdAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
                      }
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  color: "var(--navy)",
};
const metricLabel: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-muted)",
  fontWeight: 600,
  marginTop: 2,
};