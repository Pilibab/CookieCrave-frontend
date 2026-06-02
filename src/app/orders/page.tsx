"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { ordersApi, bomApi, inventoryApi } from "@/lib/api";
import type { Order, BOMEntry, OrderStatus } from "@/types/mytypes";

const STATUS_OPTIONS: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Baking",
  "Out for Delivery",
  "For Pickup",
  "Completed",
  "Cancelled",
];

const STATUSES_REQUIRING_BOM: OrderStatus[] = [
  "Confirmed",
  "Baking",
  "Out for Delivery",
  "For Pickup",
  "Completed",
];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Pending:            { bg: "rgba(254,243,199,0.12)", text: "#fef08a",  border: "#fef08a22" },
  Confirmed:          { bg: "rgba(220,252,231,0.10)", text: "#86efac",  border: "#86efac22" },
  Baking:             { bg: "rgba(254,215,170,0.12)", text: "#fdba74",  border: "#fdba7422" },
  "Out for Delivery": { bg: "rgba(186,230,253,0.12)", text: "#7dd3fc",  border: "#7dd3fc22" },
  "For Pickup":       { bg: "rgba(186,230,253,0.12)", text: "#7dd3fc",  border: "#7dd3fc22" },
  Completed:          { bg: "rgba(220,252,231,0.12)", text: "#bbf7d0",  border: "#bbf7d022" },
  Cancelled:          { bg: "rgba(254,226,226,0.12)", text: "#fca5a5",  border: "#fca5a522" },
};

export default function OrdersPage() {
  const { data: orders, loading, error, refetch } = useFetch<Order[]>(ordersApi.list);

  const [updatingId, setUpdatingId]       = useState<number | null>(null);
  const [deductionLog, setDeductionLog]   = useState<Record<number, string>>({});
  const [deductError, setDeductError]     = useState<Record<number, string>>({});
  const [validationError, setValidationError] = useState<Record<number, string>>({});

  const validateBOM = async (order: Order): Promise<number[]> => {
    const productIds: number[] = Array.isArray((order as any).prod_ids)
      ? (order as any).prod_ids
      : [(order as any).prod_id].filter(Boolean);

    if (productIds.length === 0) return [];

    const missingBOM: number[] = [];

    await Promise.all(
      productIds.map(async (prodId) => {
        try {
          const entries: BOMEntry[] = await bomApi.getByProduct(prodId);
          if (!entries || entries.length === 0) {
            missingBOM.push(prodId);
          }
        } catch {
          missingBOM.push(prodId);
        }
      })
    );

    return missingBOM;
  };

  const handleStatusChange = async (
    orderId: number,
    currentOrder: Order,
    nextStatus: OrderStatus
  ) => {
    if (updatingId === orderId) return;

    setValidationError((prev) => ({ ...prev, [orderId]: "" }));
    setDeductError((prev) => ({ ...prev, [orderId]: "" }));

    try {
      setUpdatingId(orderId);

      if (STATUSES_REQUIRING_BOM.includes(nextStatus)) {
        const missingBOM = await validateBOM(currentOrder);
        if (missingBOM.length > 0) {
          setValidationError((prev) => ({
            ...prev,
            [orderId]: `Cannot move to "${nextStatus}" — product${missingBOM.length > 1 ? "s" : ""} #${missingBOM.join(", #")} ${missingBOM.length > 1 ? "have" : "has"} no BOM configured.`,
          }));
          return;
        }
      }

      await ordersApi.update(orderId, { ...currentOrder, order_status: nextStatus });

      if (nextStatus === "Completed" && currentOrder.order_status !== "Completed") {
        try {
          await inventoryApi.deductByOrder(orderId);
          setDeductionLog((prev) => ({ ...prev, [orderId]: "Stock deducted" }));
        } catch (deductErr: any) {
          const msg =
            deductErr?.detail ??
            deductErr?.message ??
            "Deduction failed — check backend logs";
          setDeductError((prev) => ({ ...prev, [orderId]: msg }));
        }
      }

      refetch();
    } catch (err: any) {
      alert(err?.message ?? "Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const statusStyle = (status: string): React.CSSProperties => {
    const c = STATUS_COLORS[status] ?? STATUS_COLORS["Pending"];
    return {
      backgroundColor: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      padding: "3px 8px",
      borderRadius: "3px",
      fontSize: "10px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      display: "inline-block",
    };
  };

  return (
    <div style={containerStyle}>
      <div style={backgroundWrapperStyle} />
      <div style={luxuryScrimOverlayStyle} />

      <div style={contentWrapperStyle}>
        <div style={headerContainerStyle}>
          <div>
            <h1 style={titleStyle}>Fulfillment Console</h1>
            <p style={subtitleStyle}>
              {orders?.length ?? 0} active orders tracked
            </p>
          </div>
        </div>

        {loading && <div style={statusMessageStyle}>Syncing fulfillment pipelines...</div>}
        {error   && <div style={{ ...statusMessageStyle, color: "#fca5a5" }}>Error: {error}</div>}

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
                    <th style={thStyle}>Inventory / BOM</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.map((ord) => {
                    const orderId    = ord.ord_id;
                    const isUpdating = updatingId === orderId;
                    const log        = deductionLog[orderId];
                    const deductErr  = deductError[orderId];
                    const bomErr     = validationError[orderId];

                    return (
                      <tr key={orderId} style={tableRowStyle}>

                        <td style={{ ...tdStyle, fontWeight: 700, color: "#C8883A" }}>
                          #{orderId}
                        </td>

                        <td style={{ ...tdStyle, color: "#FFFFFF" }}>
                          {ord.cust_id ?? "—"}
                        </td>

                        <td style={{ ...tdStyle, color: "#FFFFFF" }}>
                          ₱{(ord.total_amount ?? 0).toLocaleString()}
                        </td>

                        <td style={{ ...tdStyle, color: "#94a3b8", fontSize: "12px" }}>
                          {(ord as any).ord_f_type ?? "—"}
                        </td>

                        <td style={tdStyle}>
                          <span style={statusStyle(ord.order_status ?? "Pending")}>
                            {ord.order_status ?? "Pending"}
                          </span>
                        </td>

                        <td style={{ ...tdStyle, fontSize: "11px", maxWidth: "280px" }}>
                          {isUpdating ? (
                            <span style={{ color: "#64748b" }}>Validating…</span>
                          ) : bomErr ? (
                            <span style={{ color: "#fde68a" }}>⚠ {bomErr}</span>
                          ) : deductErr ? (
                            <span style={{ color: "#fca5a5" }}>✗ {deductErr}</span>
                          ) : log ? (
                            <span style={{ color: "#bbf7d0" }}>✓ {log}</span>
                          ) : ord.order_status === "Completed" ? (
                            <span style={{ color: "#64748b", fontStyle: "italic" }}>deducted</span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <select
                            style={{
                              ...selectStyle,
                              opacity: isUpdating ? 0.5 : 1,
                              cursor: isUpdating ? "not-allowed" : "pointer",
                            }}
                            value={ord.order_status ?? "Pending"}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleStatusChange(orderId, ord, e.target.value as OrderStatus)
                            }
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option
                                key={s}
                                value={s}
                                style={{ backgroundColor: "#141210", color: "#fff" }}
                              >
                                {isUpdating && s === (ord.order_status ?? "Pending")
                                  ? "Validating..."
                                  : s}
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