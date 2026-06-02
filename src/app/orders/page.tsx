"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { ordersApi, bomApi, inventoryApi } from "@/lib/api";
import type { Order, BOMEntry, InventoryItem, OrderStatus } from "@/types/mytypes";

// type OrderStatus = "Pending"| "Confirmed"| "Baking"| "Out for Delivery"| "For Pickup"| "Completed"| "Cancelled";

const STATUS_OPTIONS: OrderStatus[] = ["Pending", "Confirmed", "Baking", "Out for Delivery", "For Pickup", "Completed", "Cancelled"];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Pending:           { bg: "rgba(254,243,199,0.12)", text: "#fef08a",  border: "#fef08a22" },
  Baking:             { bg: "rgba(254,215,170,0.12)", text: "#fdba74",  border: "#fdba7422" },
  "Out for Delivery":{ bg: "rgba(186,230,253,0.12)", text: "#7dd3fc",  border: "#7dd3fc22" },
  "For Pickup": { bg: "rgba(186,230,253,0.12)", text: "#7dd3fc",  border: "#7dd3fc22" },
  Completed:         { bg: "rgba(220,252,231,0.12)", text: "#bbf7d0",  border: "#bbf7d022" },
  Cancelled:         { bg: "rgba(254,226,226,0.12)", text: "#fca5a5",  border: "#fca5a522" },
};

export default function OrdersPage() {
  const { data: orders, loading, error, refetch } = useFetch<Order[]>(ordersApi.list);
  const { data: inventory } = useFetch<InventoryItem[]>(inventoryApi.list);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deductionLog, setDeductionLog] = useState<Record<number, string>>({});

  const handleStatusChange = async (
    orderId: number,
    currentOrder: Order,
    nextStatus: OrderStatus
  ) => {
    if (updatingId === orderId) return;

    try {
      setUpdatingId(orderId);

      // 1. Update order status
      await ordersApi.update(orderId, { ...currentOrder, order_status: nextStatus });

      // 2. On Completed — fetch BOM for each product in this order, then deduct inventory
      if (nextStatus === "Completed" && currentOrder.order_status !== "Completed") {
        // Orders may have a single prod_id or an array — handle both
        const productIds: number[] = Array.isArray((currentOrder as any).prod_ids)
          ? (currentOrder as any).prod_ids
          : [(currentOrder as any).prod_id].filter(Boolean);

        const deductions: string[] = [];

        for (const productId of productIds) {
          // Fetch BOM entries for this product from backend
          // Returns: BOMEntry[] each with { inv_id, quantity, ... }
          let bomEntries: BOMEntry[] = [];
          try {
            bomEntries = await bomApi.getByProduct(productId);
          } catch {
            continue; // no BOM for this product, skip
          }

          for (const entry of bomEntries) {
            // Match the BOM's inv_id to the fetched inventory list
            const invItem = inventory?.find((i) => i.inv_id === entry.inv_id);
            if (!invItem) continue;

            const deductQty = entry.bom_quan_req ?? (entry as any).bom_quantity ?? 0;
            if (deductQty <= 0) continue;

            // Use adjustStock with a negative amount to deduct
            await inventoryApi.adjustStock(invItem.inv_id, -deductQty);
            deductions.push(`−${deductQty} ${invItem.inv_uom} ${invItem.inv_ing_name}`);
          }
        }

        if (deductions.length > 0) {
          setDeductionLog((prev) => ({
            ...prev,
            [orderId]: deductions.join(", "),
          }));
        }
      }

      refetch();
    } catch (err: any) {
      alert(err?.message ?? "Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const statusStyle = (status: string) => {
    const c = STATUS_COLORS[status] ?? STATUS_COLORS["Pending"];
    return {
      backgroundColor: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      padding: "3px 8px",
      borderRadius: "3px",
      fontSize: "10px",
      fontWeight: 700 as const,
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
      display: "inline-block",
    };
  };

  return (
    <div style={containerStyle}>
      <div style={backgroundWrapperStyle} />
      <div style={luxuryScrimOverlayStyle} />

      <div style={contentWrapperStyle}>
        {/* Header */}
        <div style={headerContainerStyle}>
          <div>
            <h1 style={titleStyle}>Fulfillment Console</h1>
            <p style={subtitleStyle}>
              {orders?.length ?? 0} active orders tracked
            </p>
          </div>
        </div>

        {loading && <div style={statusMessageStyle}>Syncing fulfillment pipelines...</div>}
        {error && <div style={{ ...statusMessageStyle, color: "#fca5a5" }}>Error: {error}</div>}

        {!loading && !error && (
          <main style={mainGlassPanelStyle}>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={thStyle}>Order ID</th>
                    <th style={thStyle}>Customer</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Current Status</th>
                    <th style={thStyle}>Inventory Deducted</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.map((ord) => {
                    const orderId = ord.ord_id;
                    const isUpdating = updatingId === orderId;
                    const log = deductionLog[orderId];

                    return (
                      <tr key={orderId} style={tableRowStyle}>
                        {/* Order ID */}
                        <td style={{ ...tdStyle, fontWeight: 700, color: "#C8883A" }}>
                          #{orderId}
                        </td>

                        {/* Customer */}
                        <td style={{ ...tdStyle, color: "#FFFFFF" }}>
                          {(ord as any).cust_id ?? "—"}
                        </td>

                        {/* Amount */}
                        <td style={{ ...tdStyle, color: "#FFFFFF" }}>
                          ₱{((ord as any).total_amount ?? 0).toLocaleString()}
                        </td>

                        {/* Fulfillment type */}
                        <td style={{ ...tdStyle, color: "#94a3b8", fontSize: "12px" }}>
                          {(ord as any).ord_f_type ?? "—"}
                        </td>

                        {/* Current status badge */}
                        <td style={tdStyle}>
                          <span style={statusStyle(ord.order_status ?? "Pending")}>
                            {ord.order_status ?? "Pending"}
                          </span>
                        </td>

                        {/* Deduction log — shown after completing */}
                        <td style={{ ...tdStyle, fontSize: "11px", color: "#64748b", maxWidth: "260px" }}>
                          {log ? (
                            <span style={{ color: "#bbf7d0" }}>✓ {log}</span>
                          ) : ord.order_status === "Completed" ? (
                            <span style={{ color: "#64748b", fontStyle: "italic" }}>deducted</span>
                          ) : "—"}
                        </td>

                        {/* Status dropdown */}
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <select
                            style={{
                              ...selectStyle,
                              opacity: isUpdating ? 0.5 : 1,
                              cursor: isUpdating ? "not-allowed" : "pointer",
                            }}
                            value={ord.order_status ?? "Pending"}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(orderId, ord, e.target.value as OrderStatus)}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s} style={{ backgroundColor: "#141210", color: "#fff" }}>
                                {isUpdating && s === (ord.order_status ?? "Pending") ? "Saving..." : s}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {orders?.length === 0 && (
                <div style={emptyStateStyle}>No orders found in this pipeline.</div>
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = { position: "relative", minHeight: "calc(100vh - var(--navbar-h, 60px))", overflowY: "auto", padding: "24px 32px", backgroundColor: "#080605", fontFamily: "system-ui, -apple-system, sans-serif", color: "#FFFFFF" };
const backgroundWrapperStyle: React.CSSProperties = { position: "fixed", top: "var(--navbar-h, 60px)", left: 0, right: 0, bottom: 0, backgroundImage: "url('/Products-bg.png')", backgroundSize: "cover", backgroundPosition: "center", opacity: 1, zIndex: 0, pointerEvents: "none" };
const luxuryScrimOverlayStyle: React.CSSProperties = { position: "fixed", top: "var(--navbar-h, 60px)", left: 0, right: 0, bottom: 0, backgroundColor: "rgba(8,6,5,0.7)", zIndex: 1, pointerEvents: "none" };
const contentWrapperStyle: React.CSSProperties = { position: "relative", zIndex: 2, maxWidth: "1340px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" };
const headerContainerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: "26px", fontWeight: "normal", fontFamily: "Georgia, serif", color: "#FFFFFF" };
const subtitleStyle: React.CSSProperties = { margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" };
const mainGlassPanelStyle: React.CSSProperties = { backgroundColor: "rgba(20,18,16,0.82)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "20px 24px", boxShadow: "0 15px 30px rgba(0,0,0,0.3)" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", textAlign: "left" };
const tableHeaderRowStyle: React.CSSProperties = { borderBottom: "1px solid rgba(255,255,255,0.08)" };
const thStyle: React.CSSProperties = { padding: "10px 12px", fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" };
const tableRowStyle: React.CSSProperties = { borderBottom: "1px solid rgba(255,255,255,0.03)" };
const tdStyle: React.CSSProperties = { padding: "14px 12px", fontSize: "13px", color: "#cbd5e1" };
const emptyStateStyle: React.CSSProperties = { padding: "40px", textAlign: "center", color: "#64748b", fontSize: "13px", fontStyle: "italic" };
const statusMessageStyle: React.CSSProperties = { textAlign: "center", padding: "32px 16px", fontSize: "13px", color: "#64748b" };
const selectStyle: React.CSSProperties = { padding: "7px 12px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(8,6,5,0.8)", fontSize: "12px", color: "#FFFFFF", outline: "none", boxSizing: "border-box", cursor: "pointer", minWidth: "160px" };