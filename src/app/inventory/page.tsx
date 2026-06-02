"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { inventoryApi } from "@/lib/api";
import type { InventoryItem, UnitType } from "@/types";

// Matches backend UnitType enum exactly
const UOM_OPTIONS: UnitType[] = ["pcs", "ml", "g", "kg", "trays"];

// Stock level filters — inventory has no order-style statuses
const FILTERS = ["All", "OK", "Low", "Critical"];

export default function InventoryPage() {
  const { data: items, loading, refetch } = useFetch<InventoryItem[]>(inventoryApi.list);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");

  // Fallback safe checks for thresholds
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
  const lowNames = lowItems.slice(0, 2).map((i) => i.inv_ing_name || "Unknown").join(", ");

  const handleReorder = async (id: number) => {
    const item = allItems.find((i) => i.inv_id === id);
    if (!item) return;
    const currentRt = item.inv_rt ?? 0;
    const currentStock = item.inv_stock ?? 0;
    const deficit = currentRt * 2 - currentStock;
    if (deficit > 0) await inventoryApi.adjustStock(id, deficit);
    refetch();
  };

  const handleReorderAll = async () => {
    for (const item of lowItems) {
      const currentRt = item.inv_rt ?? 0;
      const currentStock = item.inv_stock ?? 0;
      const deficit = currentRt * 2 - currentStock;
      if (deficit > 0) await inventoryApi.adjustStock(item.inv_id, deficit);
    }
    refetch();
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ color: "#0f172a", fontSize: 28, fontWeight: 700, margin: 0 }}>Inventory</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4, margin: 0 }}>
            {allItems.length} ingredients
            {lowItems.length > 0 && (
              <span style={{ color: "#df473c", fontWeight: 600, marginLeft: 8 }}>
                · {lowItems.length} low stock
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-secondary"
            onClick={handleReorderAll}
            disabled={lowItems.length === 0}
            style={{
              background: "#fff", border: "1px solid #e2e8f0", color: "#64748b",
              borderRadius: 20, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}
          >
            Reorder All
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { setEditing(null); setShowForm(true); }}
            style={{
              background: "#0f172a", border: "none", color: "#fff",
              borderRadius: 20, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}
          >
            + New Item
          </button>
        </div>
      </div>

      {showForm && (
        <InventoryForm initial={editing} onClose={() => setShowForm(false)} onSaved={refetch} />
      )}

      {/* Stock level filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              background: activeFilter === f ? "#0f172a" : "#fff",
              color: activeFilter === f ? "#fff" : "#334155",
              border: "1px solid #e2e8f0",
              borderRadius: 16, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}>
        {loading && <div className="spinner" style={{ padding: 24, textAlign: "center" }}>Loading...</div>}
        {!loading && (
          <div className="table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "16px 20px", color: "#94a3b8", fontWeight: 500, fontSize: "13px" }}>Item</th>
                  <th style={{ padding: "16px 20px" }}></th>
                  <th style={{ padding: "16px 20px", color: "#94a3b8", fontWeight: 500, fontSize: "13px" }}>Qty</th>
                  <th style={{ padding: "16px 20px", color: "#94a3b8", fontWeight: 500, fontSize: "13px" }}>Max</th>
                  <th style={{ padding: "16px 20px", color: "#94a3b8", fontWeight: 500, fontSize: "13px" }}>Reorder</th>
                  <th style={{ padding: "16px 20px", color: "#94a3b8", fontWeight: 500, fontSize: "13px" }}>Level</th>
                  <th style={{ padding: "16px 20px", color: "#94a3b8", fontWeight: 500, fontSize: "13px" }}>Category</th>
                  <th style={{ padding: "16px 20px" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const stock = item.inv_stock ?? 0;
                  const reorderTrigger = item.inv_rt ?? 0;
                  
                  // Safe mapping logic for items that might be missing certain fields
                  const maxVal = item.inv_max ?? (reorderTrigger * 2 || 10); 
                  const maxCapacityForBar = Math.max(maxVal, stock, 1);
                  const pct = (stock / maxCapacityForBar) * 100;
                  
                  const critical = isCritical(item);
                  const low = isLow(item);

                  return (
                    <tr key={item.inv_id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      {/* Ingredient Name */}
                      <td style={{ padding: "16px 20px", fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap" }}>
                        {item.inv_ing_name || "Unnamed Item"}
                      </td>

                      {/* Bar indicator */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ width: 120, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                          <div
                            style={{ 
                              width: `${Math.min(pct, 100)}%`, 
                              height: "100%", 
                              background: critical ? "#df473c" : "#0f172a",
                              borderRadius: 4 
                            }}
                          />
                        </div>
                      </td>

                      {/* Qty field */}
                      <td style={{ padding: "16px 20px", fontWeight: 700, color: "#0f172a" }}>
                        {stock} {item.inv_uom || "units"}
                      </td>

                      {/* Max threshold */}
                      <td style={{ padding: "16px 20px", color: "#94a3b8" }}>
                        {maxVal}
                      </td>

                      {/* Reorder threshold */}
                      <td style={{ padding: "16px 20px", color: "#94a3b8" }}>
                        {reorderTrigger}
                      </td>

                      {/* Level Status pill */}
                      <td style={{ padding: "16px 20px" }}>
                        {critical ? (
                          <span style={{
                            background: "#fef2f2", color: "#991b1b",
                            padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600,
                            display: "inline-flex", alignItems: "center", gap: 6
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
                            Critical
                          </span>
                        ) : low ? (
                          <span style={{
                            background: "#fffbeb", color: "#b45309",
                            padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600,
                            display: "inline-flex", alignItems: "center", gap: 6
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                            Low
                          </span>
                        ) : (
                          <span style={{
                            background: "#f0fdf4", color: "#16a34a",
                            padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600,
                            display: "inline-flex", alignItems: "center", gap: 6
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                            OK
                          </span>
                        )}
                      </td>

                      {/* Category field */}
                      <td style={{ padding: "16px 20px", color: "#94a3b8", fontSize: 13 }}>
                        {item.inv_category ?? "Ingredients"}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => { setEditing(item); setShowForm(true); }}
                            style={{
                              background: "#f1f5f9", border: "none", color: "#64748b",
                              borderRadius: 6, padding: "6px 10px", fontSize: 13, cursor: "pointer",
                            }}
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleReorder(item.inv_id)}
                            style={{
                              background: "#fee2e2", border: "none", color: "#ef4444",
                              borderRadius: 6, padding: "6px 10px", fontSize: 13, cursor: "pointer",
                            }}
                          >
                            ↺
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inventory Form Modal ─────────────────────────────────────────────────────

function InventoryForm({
  initial, onClose, onSaved,
}: {
  initial: InventoryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    inv_ing_name: initial?.inv_ing_name ?? "",
    inv_stock:    initial?.inv_stock    ?? 0,
    inv_uom:      (initial?.inv_uom     ?? "pcs") as UnitType,
    inv_rt:       initial?.inv_rt       ?? 0,
    inv_max:      initial?.inv_max      ?? 10,
    inv_category: initial?.inv_category ?? "Ingredients"
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!form.inv_ing_name || form.inv_ing_name.length < 3) {
      setErr("Ingredient name must be at least 3 characters."); return;
    }
    setSaving(true);
    try {
      if (initial) {
        await inventoryApi.update(initial.inv_id, form);
      } else {
        await inventoryApi.create(form);
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3 style={{ marginBottom: 16, fontSize: 16, color: "#0f172a" }}>
          {initial ? "Edit Ingredient" : "New Ingredient"}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "#64748b" }}>Ingredient Name</label>
            <input
              style={{ width: "100%", padding: "8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
              value={form.inv_ing_name}
              onChange={(e) => setForm({ ...form, inv_ing_name: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "#64748b" }}>Current Stock</label>
              <input
                style={{ width: "100%", padding: "8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
                type="number"
                value={form.inv_stock}
                onChange={(e) => setForm({ ...form, inv_stock: Number(e.target.value) })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "#64748b" }}>Unit</label>
              <select
                style={{ width: "100%", padding: "8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
                value={form.inv_uom}
                onChange={(e) => setForm({ ...form, inv_uom: e.target.value as UnitType })}
              >
                {UOM_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "#64748b" }}>Reorder Trigger</label>
              <input
                style={{ width: "100%", padding: "8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
                type="number"
                value={form.inv_rt}
                onChange={(e) => setForm({ ...form, inv_rt: Number(e.target.value) })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "#64748b" }}>Max Capacity</label>
              <input
                style={{ width: "100%", padding: "8px", border: "1px solid #e2e8f0", borderRadius: 6 }}
                type="number"
                value={form.inv_max}
                onChange={(e) => setForm({ ...form, inv_max: Number(e.target.value) })}
              />
            </div>
          </div>
          {err && <p style={{ color: "#ef4444", fontSize: 12, margin: 0 }}>{err}</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: 6, cursor: "pointer" }} onClick={onClose}>Cancel</button>
            <button style={{ background: "#0f172a", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer" }} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
};
const modal: React.CSSProperties = {
  background: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 420,
};