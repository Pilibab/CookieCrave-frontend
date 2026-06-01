"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { productsApi } from "@/lib/api";
import type { Product } from "./index"; // Using index.ts for accurate typing

const CATEGORIES = ["All", "Classic", "Specialty", "Unavailable"];

export default function ProductsPage() {
  const { data: products, loading, refetch } = useFetch<Product[]>(productsApi.list);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = (products ?? []).filter((p) => {
    const matchSearch =
      !search || p.prod_name.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      activeCategory === "All" ||
      (activeCategory === "Unavailable" && !p.prod_available) ||
      (activeCategory !== "Unavailable" && p.prod_available);
    return matchSearch && matchCat;
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await productsApi.delete(id);
    refetch();
  };

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, letterSpacing: "-0.5px" }}>
            Products
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, margin: "4px 0 0" }}>
            {products?.length ?? 0} products · changes sync to customer order page
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Search */}
          <div className="search-bar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* New product button */}
          <button
            className="btn btn-primary"
            onClick={() => { setEditing(null); setShowForm(true); }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Product
          </button>
        </div>
      </div>

      {/* ── Category pills ── */}
      <div style={{ display: "flex", gap: 8, margin: "24px 0 28px" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`status-btn ${activeCategory === cat ? "active" : ""}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Modal ── */}
      {showForm && (
        <ProductForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={refetch}
        />
      )}

      {/* ── Product rows (list style) ── */}
      {loading && <div className="spinner" />}
      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((p) => (
            <div
              key={p.prod_id}
              style={{
                background: "var(--warm-white)",
                border: "1.5px solid var(--border)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                padding: "14px 20px",
                gap: 18,
                opacity: p.prod_available ? 1 : 0.6,
                transition: "box-shadow .2s, transform .2s",
                boxShadow: "0 1px 4px rgba(13,18,64,0.05)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(13,18,64,0.10)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(13,18,64,0.05)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 12,
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "var(--cream)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Fallback to emoji since product interface does not contain an image parameter */}
                <span style={{ fontSize: 30 }}>🍪</span>
              </div>

              {/* Name + desc */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
                    {p.prod_name}
                  </span>
                  <span
                    className="badge"
                    style={{
                      fontSize: 10,
                      padding: "2px 9px",
                      background: p.prod_available ? "#dcfce7" : "#fee2e2",
                      color: p.prod_available ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    {p.prod_available ? "Available" : "Unavailable"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 340,
                  }}
                >
                  {p.prod_desc ?? "No description"}
                </p>
                {p.shelf_life && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "block", opacity: 0.7 }}>
                    Shelf life: {p.shelf_life}
                  </span>
                )}
              </div>

              {/* Price */}
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 17,
                  color: "var(--navy)",
                  minWidth: 80,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                ₱{p.prod_price != null ? Number(p.prod_price).toFixed(2) : "0.00"}
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400, marginTop: 1 }}>
                  per cookie
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => { setEditing(p); setShowForm(true); }}
                  className="btn btn-secondary"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.prod_id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="empty-state" style={{ padding: "60px 0", fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🍪</div>
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Product Form Modal ───────────────────────────────────────────────────────

function ProductForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    prod_name: initial?.prod_name ?? "",
    prod_desc: initial?.prod_desc ?? "",
    prod_price: initial?.prod_price ?? 0,
    prod_available: initial?.prod_available ?? true,
    shelf_life: initial?.shelf_life ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!form.prod_name || form.prod_price < 0) {
      setErr("Name and a valid price are required.");
      return;
    }
    setSaving(true);
    try {
      if (initial) {
        await productsApi.update(initial.prod_id, form);
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
        <h3 style={{ fontSize: 22, color: "var(--navy)", marginBottom: 22, letterSpacing: "-0.3px" }}>
          {initial ? "Edit Product" : "New Product"}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input className="form-input" value={form.prod_name} onChange={(e) => setForm({ ...form, prod_name: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              style={{ resize: "vertical" }}
              rows={3}
              value={form.prod_desc}
              onChange={(e) => setForm({ ...form, prod_desc: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Price (₱) *</label>
              <input
                className="form-input"
                type="number"
                min={0}
                step={0.01}
                value={form.prod_price}
                onChange={(e) => setForm({ ...form, prod_price: Number(e.target.value) })}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Shelf Life</label>
              <input
                className="form-input"
                value={form.shelf_life}
                placeholder="e.g. 3 days"
                onChange={(e) => setForm({ ...form, shelf_life: e.target.value })}
              />
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.prod_available}
              onChange={(e) => setForm({ ...form, prod_available: e.target.checked })}
            />
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>Available for ordering</span>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                When enabled, this product appears in the customer order page
              </p>
            </div>
          </label>

          {err && <p style={{ color: "var(--danger)", fontSize: 12, margin: 0 }}>{err}</p>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared configurations ───────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(13,18,64,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 200,
  backdropFilter: "blur(2px)",
};

const modal: React.CSSProperties = {
  background: "var(--warm-white)",
  borderRadius: 20,
  padding: 30,
  width: "100%",
  maxWidth: 460,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(13,18,64,0.15)",
};