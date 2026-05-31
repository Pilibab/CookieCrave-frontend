"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { inventoryApi } from "@/lib/api";
import type { InventoryItem } from "@/types";

const FILTERS = ["All", "Pending", "Preparing", "Ready"];

export default function InventoryPage() {
  const { data: items, loading, refetch } = useFetch(inventoryApi.list);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");

  const isLow = (item: InventoryItem) => item.current_stock <= item.recorder_trigger;
  const isCritical = (item: InventoryItem) => item.current_stock <= item.recorder_trigger * 0.5;

  const lowItems = (items ?? []).filter(isLow);
  const lowNames = lowItems.slice(0, 2).map(i => i.ingredients_name).join(", ");

  const handleReorder = async (id: number) => {
    // Adjust stock to max level (recorder_trigger * 3 as default reorder qty)
    const item = (items ?? []).find(i => i.inventory_id === id);
    if (!item) return;
    await inventoryApi.adjustStock(id, item.recorder_trigger * 2);
    refetch();
  };

  const handleReorderAll = async () => {
    for (const item of (items ?? []).filter(isLow)) {
      await inventoryApi.adjustStock(item.inventory_id, item.recorder_trigger * 2);
    }
    refetch();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title text-var(--navy)">Inventory</h1>
          <p className="text-var(--text-muted) mt-0.5 text-xs">
            {items?.length ?? 0} items
          </p>
        </div>
        <div className="flex gap-2.5">
          <button 
          className="btn btn-outline bg-transparent text-[var(--navy)] border-[var(--navy)]" 
          onClick={handleReorderAll}>
            Reorder All
          </button>
          <button 
          className="btn btn-primary" 
          onClick={() => { setEditing(null); setShowForm(true); }}>
            + New Item
          </button>
        </div>
      </div>

      {showForm && (
        <InventoryForm initial={editing} onClose={() => setShowForm(false)} onSaved={refetch} />
      )}

      {/* Low stock alert banner */}
      {lowItems.length > 0 && (
        <div className="bg-[#fff1f0] border border-[#fecaca] rounded-xl px-4.5 py-3 flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="text-[13px] text-[#c0392b] font-semibold">
              {lowItems.length} items below threshold: {lowNames}{lowItems.length > 2 ? "…" : ""}
            </span>
          </div>
          <button
            onClick={handleReorderAll}
            className="bg-[#c0392b] text-white border-none rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer"
          >
            Reorder All
          </button>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`status-btn${activeFilter === f ? " active" : ""}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden" >
        {/* Status header inside card */}
        <div 
        className="px-6 py-3 border-b border-[var(--border)] flex justify-end"
        >
          <span className="text-xs font-semibold text-[var(--text-muted)]">Status</span>
        </div>

        {loading && <div className="spinner" />}
        {!loading && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th></th>
                  <th>Qty</th>
                  <th>Max</th>
                  <th>Reorder</th>
                  <th>Level</th>
                  <th>Category</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((item) => {
                  const pct = item.current_stock / (item.recorder_trigger * 2 || 1) * 100;
                  const critical = isCritical(item);
                  const low = isLow(item);
                  return (
                    <tr key={item.inventory_id}>
                      <td className="font-semibold whitespace-nowrap">{item.ingredients_name}</td>
                      <td>
                        {/* Stock bar */}
                        <div className="stock-bar-bg w-[120px]" >
                          <div
                            className={`stock-bar-fill${critical ? " critical" : ""}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="font-semibold">{item.current_stock} {item.unit_of_measure}</td>
                      <td className="text-[var(--text-muted)]">{item.recorder_trigger * 2}</td>
                      <td className="text-[var(--text-muted)]">{item.recorder_trigger}</td>
                      <td>
                        {critical ? (
                          <span className="badge-critical">● Critical</span>
                        ) : low ? (
                          <span className="text-[#e67e22] font-bold text-xs">● Low</span>
                        ) : (
                          <span className="text-[#e67e22] font-bold text-xs">● OK</span>
                        )}
                      </td>
                      <td className="text-[var(--text-muted)] text-xs">Ingredients</td>
                      <td>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => { setEditing(item); setShowForm(true); }}
                            className="bg-[var(--cream)] border border-[var(--border)] rounded md:rounded-sm px-2 py-1 text-[11px] cursor-pointer"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleReorder(item.inventory_id)}
                            className="bg-[#fde8e8] border border-[#fecaca] rounded px-2 py-1 text-[11px] cursor-pointer text-[#c0392b]"
                          >
                            ↺
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state"><p>No inventory items</p></div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryForm({
  initial, onClose, onSaved,
}: { initial: InventoryItem | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    ingredients_name: initial?.ingredients_name ?? "",
    current_stock: initial?.current_stock ?? 0,
    unit_of_measure: initial?.unit_of_measure ?? "",
    recorder_trigger: initial?.recorder_trigger ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!form.ingredients_name || !form.unit_of_measure) { setErr("Name and unit are required."); return; }
    setSaving(true);
    try {
      if (initial) {
        await inventoryApi.update(initial.inventory_id, form);
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
    <div className="overlay">
      <div className="bg-white rounded-[14px] p-7 w-full max-w-[460px]">
        <h3 className="mb-4 text-base font-semibold">{initial ? "Edit Ingredient" : "New Ingredient"}</h3>
        <div className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label">Ingredient Name *</label>
            <input className="form-input" placeholder="e.g. Chocolate Chips, Unsalted Butter" value={form.ingredients_name} onChange={(e) => setForm({ ...form, ingredients_name: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <div className="form-group flex-1" >
              <label className="form-label">Current Stock</label>
              <input 
                className="form-input" 
                type="number" min={0} 
                placeholder="e.g. 3" 
                step={0.01} value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: Number(e.target.value) })} />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Unit of Measure *</label>
              <input className="form-input" value={form.unit_of_measure} onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })} placeholder="e.g. grams, cups" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reorder Trigger</label>
            <input 
            className="form-input" 
            type="number" min={0} 
            placeholder="e.g 7"
            value={form.recorder_trigger} 
            onChange={(e) => setForm({ ...form, recorder_trigger: Number(e.target.value) })} />
          </div>
          {err && <p className="text-[#c0392b] text-xs">{err}</p>}
          <div className="flex gap-2 justify-end">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
};
const modal: React.CSSProperties = {
  background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 460,
};