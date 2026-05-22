"use client";

import { useState } from "react";
import { useFetch, useMutation } from "@/hooks/useFetch";
import { productsApi } from "@/lib/api";
import type { Product } from "@/types";

export default function ProductsPage() {
  const { data: products, loading, refetch } = useFetch(productsApi.list);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  return (
    <div className="page-body">
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          + Add Product
        </button>
      </div>

      {showForm && (
        <ProductForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={refetch}
        />
      )}

      <div className="card">
        {loading && <div className="spinner" />}
        {!loading && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Shelf Life</th>
                  <th>Available</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(products ?? []).map((p) => (
                  <tr key={p.product_id}>
                    <td style={{ color: "#6b6f8a" }}>#{p.product_id}</td>
                    <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                    <td style={{ maxWidth: 220, fontSize: 13, color: "#6b6f8a" }}>{p.product_description ?? "—"}</td>
                    <td style={{ fontWeight: 600, color: "#c8883a" }}>₱{Number(p.price).toFixed(2)}</td>
                    <td>{p.shelf_life ?? "—"}</td>
                    <td>
                      <span className={`badge ${p.is_available ? "badge-completed" : "badge-cancelled"}`}>
                        {p.is_available ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 12, padding: "4px 10px" }}
                        onClick={() => { setEditing(p); setShowForm(true); }}
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

function ProductForm({
  initial, onClose, onSaved,
}: { initial: Product | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    product_name: initial?.product_name ?? "",
    product_description: initial?.product_description ?? "",
    price: initial?.price ?? 0,
    is_available: initial?.is_available ?? true,
    shelf_life: initial?.shelf_life ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!form.product_name || form.price < 0) { setErr("Name and valid price are required."); return; }
    setSaving(true);
    try {
      if (initial) {
        await productsApi.update(initial.product_id, form);
      } else {
        await productsApi.create(form);
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
        <h3 style={{ marginBottom: 16 }}>{initial ? "Edit Product" : "New Product"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input className="form-input" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} value={form.product_description} onChange={(e) => setForm({ ...form, product_description: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Price (₱) *</label>
              <input className="form-input" type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Shelf Life</label>
              <input className="form-input" value={form.shelf_life} onChange={(e) => setForm({ ...form, shelf_life: e.target.value })} placeholder="e.g. 3 days" />
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
              <span className="form-label" style={{ margin: 0 }}>Available for ordering</span>
            </label>
          </div>
          {err && <p style={{ color: "#c0392b", fontSize: 13 }}>{err}</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
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
