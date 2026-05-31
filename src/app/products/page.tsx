"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { productsApi } from "@/lib/api";
import type { Product } from "@/types";

const CATEGORIES = ["All", "Classic", "Specialty"];

export default function ProductsPage() {
  const { data: products, loading, refetch } = useFetch(productsApi.list);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = (products ?? []).filter(p =>
    !search || p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await productsApi.delete(id);
    refetch();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {products?.length ?? 0} products
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="search-bar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            + New Product
          </button>
        </div>
      </div>

      {showForm && (
        <ProductForm initial={editing} onClose={() => setShowForm(false)} onSaved={refetch} />
      )}

      {/* Category filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`status-btn${activeCategory === cat ? " active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && <div className="spinner" />}
      {!loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
          paddingTop: 40,
        }}>
          {filtered.map((p) => (
            <div key={p.product_id} style={{
              background: "var(--cream)",
              borderRadius: 0,
              border: "1.5px solid var(--navy)",
              display: "flex",
              flexDirection: "column",
              overflow: "visible",
              position: "relative",
              marginTop: 110,
            }}>

              {/* ── Cookie image — natural shape, overlaps top of card ── */}
              <div style={{
                position: "absolute",
                top: -110,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 2,
                width: 220,
                height: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.product_name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      filter: "drop-shadow(0 6px 14px rgba(13,18,64,0.22))",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 72, filter: "drop-shadow(0 4px 10px rgba(13,18,64,0.18))" }}>🍪</span>
                )}
              </div>

              {/* Card body — starts below the overflowing image */}
              <div style={{
                padding: "116px 14px 16px",
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}>
                {/* Name + badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginBottom: 2,
                  flexWrap: "wrap",
                }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)", textAlign: "center" }}>
                    {p.product_name}
                  </span>
                  {p.is_available && (
                    <span style={{
                      background: "#fbbf24",
                      color: "#7d4b00",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}>Best Seller</span>
                  )}
                </div>

                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 3, textAlign: "center" }}>
                  {p.product_description ?? "Classic"}
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  fontSize: 12,
                  color: "#e67e22",
                  marginBottom: 6,
                }}>
                  ★ <span style={{ color: "var(--text)" }}>4.9</span>
                  <span style={{ color: "var(--text-muted)" }}>· 1200 sold</span>
                </div>

                <div style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "var(--navy)",
                  marginBottom: 12,
                  textAlign: "center",
                }}>
                  ₱{Number(p.price).toFixed(2)}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <button
                    onClick={() => { setEditing(p); setShowForm(true); }}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: 6,
                      border: "1.5px solid var(--border)",
                      background: "var(--warm-white)",
                      color: "var(--navy)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.product_id)}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: 6,
                      border: "1.5px solid #fecaca",
                      background: "#fde8e8",
                      color: "#c0392b",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1" }}>
              <div className="empty-state"><p>No products found</p></div>
            </div>
          )}
        </div>
      )}
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
    image: initial?.image ?? "",
  });
  const [imagePreview, setImagePreview] = useState<string>(initial?.image ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setForm(f => ({ ...f, image: result }));
    };
    reader.readAsDataURL(file);
  };

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
        <h3 style={{ marginBottom: 16, fontSize: 16 }}>{initial ? "Edit Product" : "New Product"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Image upload */}
          <div className="form-group">
            <label className="form-label">Product Image *</label>
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              border: "1.5px dashed #b0b8d1", borderRadius: 10, padding: "12px 16px",
              cursor: "pointer", background: "#f8f9fc", gap: 8, minHeight: 100,
            }}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={{ height: 80, objectFit: "contain", borderRadius: 6 }} />
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8a94b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span style={{ fontSize: 12, color: "#8a94b0" }}>Click to upload a cookie photo</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            </label>
            {imagePreview && (
              <button onClick={() => { setImagePreview(""); setForm(f => ({ ...f, image: "" })); }}
                style={{ marginTop: 4, fontSize: 11, color: "#c0392b", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                Remove image
              </button>
            )}
          </div>

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
          {err && <p style={{ color: "#c0392b", fontSize: 12 }}>{err}</p>}
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
  background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 460,
};