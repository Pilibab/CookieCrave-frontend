"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { inventoryApi} from "@/lib/api";
import type { InventoryItem, UnitType } from "@/types/mytypes";

const UOM_OPTIONS: UnitType[] = ["pcs", "ml", "g", "kg"];
const FILTERS = ["All", "OK", "Low", "Critical"];

const TO_BASE: Record<UnitType, number> = { pcs: 1, ml: 0.001, g: 0.001, kg: 1 };
const DIMENSION: Record<UnitType, string> = { pcs: "count", ml: "volume", g: "mass", kg: "mass" };

function convertUnit(value: number, from: UnitType, to: UnitType): number {
  if (from === to) return value;
  if (DIMENSION[from] !== DIMENSION[to]) return value;
  return (value * TO_BASE[from]) / TO_BASE[to];
}

// ─── Inventory Form ────────────────────────────────────────────────────────────
function InventoryForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: InventoryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = initial !== null;

  const [name, setName]               = useState(initial?.inv_ing_name ?? "");
  const [stock, setStock]             = useState<number>(initial?.inv_stock ?? 0);
  const [uom, setUom]                 = useState<UnitType>((initial?.inv_uom as UnitType) ?? "pcs");
  const [rt, setRt]                   = useState<number>(initial?.inv_rt ?? 0);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [saving, setSaving]           = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEditing && initial) {
        if (adjustAmount !== 0) {
          await inventoryApi.adjustStock(initial.inv_id, adjustAmount);
        }
        await (inventoryApi as any).update(initial.inv_id, {
          inv_ing_name: name,
          inv_uom: uom,
          inv_rt: rt,
        });
      } else {
        await inventoryApi.create({
          inv_ing_name: name,
          inv_stock: stock,
          inv_uom: uom,
          inv_rt: rt,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      let msg = "Unknown error";
      try {
        if (typeof err === "string") msg = err;
        else if (err instanceof Error) msg = err.message;
        else {
          const detail = err?.detail ?? err?.message ?? err?.error;
          msg = detail !== undefined
            ? (typeof detail === "string" ? detail : JSON.stringify(detail))
            : JSON.stringify(err, Object.getOwnPropertyNames(err)) ?? String(err);
        }
      } catch { try { msg = String(err); } catch { msg = "Unserializable error"; } }
      alert(`Failed to save ingredient:\n${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>{isEditing ? "Edit Ingredient" : "New Ingredient"}</h2>
          <button style={modalCloseBtnStyle} onClick={onClose}>✕</button>
        </div>

        {/* Ingredient Name */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Ingredient Name</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Flour"
          />
        </div>

        {/* Initial Stock — only when creating */}
        {!isEditing && (
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Initial Stock</label>
            <input
              style={inputStyle}
              type="number"
              value={stock}
              min={0}
              onChange={(e) => setStock(Number(e.target.value))}
            />
          </div>
        )}

        {/* Adjust Stock — only when editing */}
        {isEditing && (
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Adjust Stock (+ to restock, − to deduct)</label>
            <input
              style={inputStyle}
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(Number(e.target.value))}
              placeholder="0"
            />
            <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
              Current stock:{" "}
              <strong style={{ color: "#FFFFFF" }}>
                {initial?.inv_stock ?? 0} {initial?.inv_uom}
              </strong>
              {adjustAmount !== 0 && (
                <>
                  {" "}→ New:{" "}
                  <strong style={{ color: adjustAmount > 0 ? "#bbf7d0" : "#fca5a5" }}>
                    {Math.max(0, (initial?.inv_stock ?? 0) + adjustAmount)} {uom}
                  </strong>
                </>
              )}
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ ...fieldGroupStyle, flex: 1 }}>
            <label style={labelStyle}>Unit of Measure</label>
            <select style={inputStyle} value={uom} onChange={(e) => setUom(e.target.value as UnitType)}>
              {UOM_OPTIONS.map((u) => (
                <option key={u} value={u} style={{ background: "#141210", color: "#fff" }}>{u}</option>
              ))}
            </select>
          </div>
          <div style={{ ...fieldGroupStyle, flex: 1 }}>
            <label style={labelStyle}>Reorder Trigger Level</label>
            <input
              style={inputStyle}
              type="number"
              value={rt}
              min={0}
              onChange={(e) => setRt(Number(e.target.value))}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button style={cancelBtnStyle} onClick={onClose} disabled={saving}>Cancel</button>
          <button
            style={{
              ...saveBtnStyle,
              opacity: !name ? 0.5 : 1,
              cursor: !name ? "not-allowed" : "pointer",
            }}
            onClick={handleSave}
            disabled={saving || !name}
          >
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Ingredient"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { data: items, loading, refetch } = useFetch<InventoryItem[]>(inventoryApi.list);
  const [showForm, setShowForm]           = useState(false);
  const [editing, setEditing]             = useState<InventoryItem | null>(null);
  const [activeFilter, setActiveFilter]   = useState("All");
  const [displayUnits, setDisplayUnits]   = useState<Record<number, UnitType>>({});

  const isLow      = (item: InventoryItem) => (item.inv_stock ?? 0) <= (item.inv_rt ?? 0);
  const isCritical = (item: InventoryItem) => (item.inv_stock ?? 0) <= (item.inv_rt ?? 0) * 0.5;

  const allItems = items ?? [];

  const filtered = allItems.filter((item) => {
    if (activeFilter === "All")      return true;
    if (activeFilter === "Critical") return isCritical(item);
    if (activeFilter === "Low")      return isLow(item) && !isCritical(item);
    if (activeFilter === "OK")       return !isLow(item);
    return true;
  });

  const lowItems = allItems.filter(isLow);

  return (
    <div style={containerStyle}>
      <div style={backgroundWrapperStyle} />
      <div style={luxuryScrimOverlayStyle} />

      <div style={contentWrapperStyle}>
        <div style={headerContainerStyle}>
          <div>
            <h1 style={titleStyle}>Bakery Inventory</h1>
            <p style={subtitleStyle}>
              {allItems.length} active ingredients listed
              {lowItems.length > 0 && (
                <span style={{ color: "#fca5a5", fontWeight: 700, marginLeft: "8px" }}>
                  · {lowItems.length} require restocking
                </span>
              )}
            </p>
          </div>
          <button style={primaryBtnStyle} onClick={() => { setEditing(null); setShowForm(true); }}>
            + New Ingredient
          </button>
        </div>

        <main style={mainGlassPanelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>Stock Streams</h2>
            <div style={filterBarStyle}>
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  style={activeFilter === f ? activeFilterBtnStyle : inactiveFilterBtnStyle}
                >
                  {f} Stocks
                </button>
              ))}
            </div>
          </div>

          {loading && <div style={statusMessageStyle}>Auditing ingredient tracking logs...</div>}

          {!loading && (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={thStyle}>Ingredient Name</th>
                    <th style={thStyle}>Stock Level</th>
                    <th style={thStyle}>Display Qty</th>
                    <th style={thStyle}>Reorder Trigger</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const stock         = item.inv_stock ?? 0;
                    const reorderTrigger = item.inv_rt ?? 0;
                    const maxVal        = (item as any).inv_max ?? (reorderTrigger * 2 || 10);
                    const pct           = (stock / Math.max(maxVal, stock, 1)) * 100;

                    const storedUnit  = (item.inv_uom as UnitType) || "pcs";
                    const currentUnit = displayUnits[item.inv_id] || storedUnit;
                    const convertedQty = convertUnit(stock, storedUnit, currentUnit);

                    return (
                      <tr key={item.inv_id} style={tableRowStyle}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: "#C8883A" }}>
                          {item.inv_ing_name || "Unnamed Item"}
                        </td>

                        <td style={tdStyle}>
                          <div style={{ width: "110px", height: "6px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "10px", overflow: "hidden" }}>
                            <div style={{
                              width: `${Math.min(pct, 100)}%`,
                              height: "100%",
                              backgroundColor: isCritical(item) ? "#fca5a5" : isLow(item) ? "#fde68a" : "#bbf7d0",
                              transition: "width 0.4s ease",
                            }} />
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: 700, color: "#FFFFFF", minWidth: "50px" }}>
                              {convertedQty % 1 === 0 ? convertedQty : convertedQty.toFixed(2)}
                            </span>
                            <select
                              value={currentUnit}
                              onChange={(e) => setDisplayUnits({ ...displayUnits, [item.inv_id]: e.target.value as UnitType })}
                              style={tableSelectStyle}
                            >
                              {UOM_OPTIONS.map((u) => (
                                <option key={u} value={u} style={{ background: "#141210", color: "#fff" }}>{u}</option>
                              ))}
                            </select>
                            {currentUnit !== storedUnit && (
                              <span style={{ fontSize: "10px", color: "#64748b" }}>
                                (stored: {stock} {storedUnit})
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ ...tdStyle, color: "#cbd5e1" }}>{reorderTrigger} {storedUnit}</td>

                        <td style={tdStyle}>
                          <span style={{
                            backgroundColor: isCritical(item) ? "rgba(254,226,226,0.12)" : isLow(item) ? "rgba(254,243,199,0.15)" : "rgba(220,252,231,0.12)",
                            color: isCritical(item) ? "#fecaca" : isLow(item) ? "#fde68a" : "#bbf7d0",
                            padding: "3px 8px",
                            borderRadius: "30px",
                            fontSize: "10px",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            border: `1px solid ${isCritical(item) ? "#fecaca" : isLow(item) ? "#fde68a" : "#bbf7d0"}22`,
                          }}>
                            {isCritical(item) ? "Critical" : isLow(item) ? "Low" : "OK"}
                          </span>
                        </td>

                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <button
                            onClick={() => { setEditing(item); setShowForm(true); }}
                            style={editActionBtnStyle}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#64748b", fontStyle: "italic", padding: "32px" }}>
                        No ingredients match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {showForm && (
        <InventoryForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = { position: "relative", minHeight: "calc(100vh - var(--navbar-h, 60px))", overflowY: "auto", padding: "24px 32px", backgroundColor: "#080605", fontFamily: "system-ui, -apple-system, sans-serif", color: "#FFFFFF" };
const backgroundWrapperStyle: React.CSSProperties = { position: "fixed", top: "var(--navbar-h, 60px)", left: 0, right: 0, bottom: 0, backgroundImage: "url('/Inventory-bg.png')", backgroundSize: "cover", backgroundPosition: "center", opacity: 1.0, zIndex: 0, pointerEvents: "none" };
const luxuryScrimOverlayStyle: React.CSSProperties = { position: "fixed", top: "var(--navbar-h, 60px)", left: 0, right: 0, bottom: 0, backgroundColor: "rgba(8, 6, 5, 0.7)", zIndex: 1, pointerEvents: "none" };
const contentWrapperStyle: React.CSSProperties = { position: "relative", zIndex: 2, maxWidth: "1340px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" };
const headerContainerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: "26px", fontWeight: "normal", fontFamily: "Georgia, serif", color: "#FFFFFF" };
const subtitleStyle: React.CSSProperties = { margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" };
const primaryBtnStyle: React.CSSProperties = { backgroundColor: "#C8883A", color: "#FFFFFF", padding: "8px 16px", borderRadius: "4px", fontWeight: 600, fontSize: "12px", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(200,136,58,0.15)" };
const mainGlassPanelStyle: React.CSSProperties = { backgroundColor: "rgba(20,18,16,0.82)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "20px 24px", boxShadow: "0 15px 30px rgba(0,0,0,0.3)" };
const panelHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" };
const panelTitleStyle: React.CSSProperties = { margin: 0, fontSize: "16px", fontWeight: "normal", fontFamily: "Georgia, serif", color: "#FFFFFF" };
const filterBarStyle: React.CSSProperties = { display: "flex", gap: "4px", flexWrap: "wrap" };
const activeFilterBtnStyle: React.CSSProperties = { backgroundColor: "rgba(200,136,58,0.12)", color: "#C8883A", border: "1px solid rgba(200,136,58,0.4)", padding: "4px 10px", borderRadius: "3px", fontSize: "11px", fontWeight: 600, cursor: "pointer" };
const inactiveFilterBtnStyle: React.CSSProperties = { backgroundColor: "transparent", color: "#64748b", border: "1px solid transparent", padding: "4px 10px", borderRadius: "3px", fontSize: "11px", fontWeight: 500, cursor: "pointer" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", textAlign: "left" };
const tableHeaderRowStyle: React.CSSProperties = { borderBottom: "1px solid rgba(255,255,255,0.08)" };
const thStyle: React.CSSProperties = { padding: "10px 12px", fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" };
const tableRowStyle: React.CSSProperties = { borderBottom: "1px solid rgba(255,255,255,0.03)" };
const tdStyle: React.CSSProperties = { padding: "12px", fontSize: "13px", color: "#cbd5e1" };
const tableSelectStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.15)", borderRadius: "3px", padding: "2px 4px", fontSize: "11px", backgroundColor: "rgba(20,18,16,0.9)", outline: "none", color: "#94a3b8", cursor: "pointer" };
const editActionBtnStyle: React.CSSProperties = { backgroundColor: "transparent", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "3px", padding: "4px 10px", fontSize: "12px", fontWeight: 600, cursor: "pointer" };
const statusMessageStyle: React.CSSProperties = { textAlign: "center", padding: "24px", fontSize: "13px", color: "#64748b" };
const modalOverlayStyle: React.CSSProperties = { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" };
const modalStyle: React.CSSProperties = { backgroundColor: "#141210", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "28px", width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 25px 50px rgba(0,0,0,0.6)" };
const modalHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const modalTitleStyle: React.CSSProperties = { margin: 0, fontSize: "18px", fontWeight: "normal", fontFamily: "Georgia, serif", color: "#FFFFFF" };
const modalCloseBtnStyle: React.CSSProperties = { background: "none", border: "none", color: "#64748b", fontSize: "16px", cursor: "pointer", padding: "4px" };
const fieldGroupStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "6px" };
const labelStyle: React.CSSProperties = { fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" };
const inputStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(8,6,5,0.8)", fontSize: "13px", color: "#FFFFFF", outline: "none", width: "100%", boxSizing: "border-box" };
const cancelBtnStyle: React.CSSProperties = { backgroundColor: "transparent", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" };
const saveBtnStyle: React.CSSProperties = { backgroundColor: "#C8883A", color: "#FFFFFF", border: "none", borderRadius: "4px", padding: "8px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer" };