"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { inventoryApi } from "@/lib/api";
import type { InventoryItem } from "@/types";

export default function InventoryPage() {
  const { data: items, loading, refetch } = useFetch(inventoryApi.list);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  const isLow = (item: InventoryItem) => item.current_stock <= item.recorder_trigger;

  return (
    <div className="page-body">
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          + Add Ingredient
        </button>
      </div>

      {showForm && (
        <InventoryForm initial={editing} onClose={() => setShowForm(false)} onSaved={refetch} />
      )}

      <div className="card">
        {loading && <div className="spinner" />}
        {!loading && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ingredient</th>
                  <th>Current Stock</th>
                  <th>Unit</th>
                  <th>Reorder Trigger</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((item) => (
                  <tr key={item.inventory_id} style={isLow(item) ? { background: "#fff5f5" } : {}}>
                    <td style={{ color: "#6b6f8a" }}>#{item.inventory_id}</td>
                    <td style={{ fontWeight: 600 }}>{item.ingredients_name}</td>
                    <td style={{ fontWeight: 700, color: isLow(item) ? "#c0392b" : "#27ae60" }}>
                      {item.current_stock}
                    </td>
                    <td>{item.unit_of_measure}</td>
                    <td style={{ color: "#6b6f8a" }}>{item.recorder_trigger}</td>
                    <td>
                      <span className={`badge ${isLow(item) ? "badge-cancelled" : "badge-completed"}`}>
                        {isLow(item) ? "Low Stock" : "OK"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 12, padding: "4px 10px" }}
                        onClick={() => { setEditing(item); setShowForm(true); }}
                      >
                        Edit
                      </button>
                    </td>
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
    <div style={overlay}>
      <div style={modal}>
        <h3 style={{ marginBottom: 16 }}>{initial ? "Edit Ingredient" : "New Ingredient"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Ingredient Name *</label>
            <input className="form-input" value={form.ingredients_name} onChange={(e) => setForm({ ...form, ingredients_name: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Current Stock</label>
              <input className="form-input" type="number" min={0} step={0.01} value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: Number(e.target.value) })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Unit of Measure *</label>
              <input className="form-input" value={form.unit_of_measure} onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })} placeholder="e.g. grams, cups" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reorder Trigger (alert when stock ≤ this)</label>
            <input className="form-input" type="number" min={0} value={form.recorder_trigger} onChange={(e) => setForm({ ...form, recorder_trigger: Number(e.target.value) })} />
          </div>
          {err && <p style={{ color: "#c0392b", fontSize: 13 }}>{err}</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
  background: "#fff", borderRadius: 12, padding: 28, width: "100%", maxWidth: 460,
};
