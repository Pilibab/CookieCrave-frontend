"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { productsApi } from "@/lib/api";
import type { Product } from "@/types";

export default function ProductsPage() {
  const { data: products, loading, error, refetch } =
    useFetch<Product[]>(productsApi.list);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");

  const filtered =
    products?.filter(
      (p) =>
        p.prod_name.toLowerCase().includes(search.toLowerCase()) ||
        p.prod_desc?.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;

    try {
      await productsApi.delete(id);
      refetch();
    } catch (err) {
      console.error(err);
      alert("Failed to delete product");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            {products?.length ?? 0} products
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div className="search-bar">
            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            + New Product
          </button>
        </div>
      </div>

      {showForm && (
        <ProductForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={refetch}
        />
      )}

      {loading && <div className="spinner" />}

      {error && (
        <div style={{ color: "red", marginTop: 20 }}>
          Error: {error}
        </div>
      )}

      {!loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {filtered.map((p) => (
            <div
              key={p.prod_id}
              style={{
                background: "var(--warm-white)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <strong>{p.prod_name}</strong>

                  <span
                    className="badge"
                    style={{
                      background: p.prod_available
                        ? "#dcfce7"
                        : "#fee2e2",
                      color: p.prod_available
                        ? "green"
                        : "red",
                    }}
                  >
                    {p.prod_available
                      ? "Available"
                      : "Unavailable"}
                  </span>
                </div>

                <p
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: "var(--text-muted)",
                  }}
                >
                  {p.prod_desc}
                </p>
              </div>

              <div
                style={{
                  textAlign: "right",
                  marginRight: 16,
                  minWidth: 90,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  ₱{Number(p.prod_price).toFixed(2)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditing(p);
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() =>
                    handleDelete(p.prod_id)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="empty-state">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!form.prod_name.trim()) {
      setErr("Product name is required.");
      return;
    }

    try {
      setSaving(true);

      if (initial) {
        await productsApi.update(initial.prod_id, form);
      } else {
        await productsApi.create(form);
      }

      onSaved();
      onClose();
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : "Failed to save"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2>
          {initial
            ? "Edit Product"
            : "New Product"}
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div className="form-group">
            <label className="form-label">
              Product Name
            </label>

            <input
              className="form-input"
              value={form.prod_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  prod_name: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Description
            </label>

            <textarea
              className="form-textarea"
              rows={3}
              value={form.prod_desc}
              onChange={(e) =>
                setForm({
                  ...form,
                  prod_desc: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Price
            </label>

            <input
              className="form-input"
              type="number"
              min={0}
              step={0.01}
              value={form.prod_price}
              onChange={(e) =>
                setForm({
                  ...form,
                  prod_price: Number(
                    e.target.value
                  ),
                })
              }
            />
          </div>

          <label
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              type="checkbox"
              checked={form.prod_available}
              onChange={(e) =>
                setForm({
                  ...form,
                  prod_available:
                    e.target.checked,
                })
              }
            />
            Available
          </label>

          {err && (
            <p style={{ color: "red" }}>
              {err}
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 100,
};

const modal: React.CSSProperties = {
  background: "#fff",
  width: "100%",
  maxWidth: 500,
  borderRadius: 16,
  padding: 24,
};