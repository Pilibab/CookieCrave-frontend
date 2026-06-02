"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { customersApi } from "@/lib/api";
import type { Customer } from "@/types";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  // Backend GET /customers returns List[Customer] (not paginated shape)
  // Accept both shapes gracefully
  const { data: raw, loading, refetch } = useFetch<Customer[] | { data: Customer[]; total: number }>(
    () => customersApi.list(page, 20) as unknown as Promise<Customer[] | { data: Customer[]; total: number }>,
    [page]
  );
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const customers: Customer[] = Array.isArray(raw)
    ? raw
    : (raw as { data: Customer[] } | null)?.data ?? [];
  const total: number = Array.isArray(raw)
    ? raw.length
    : (raw as { total: number } | null)?.total ?? 0;

  const filtered = customers.filter((c) =>
    !search ||
    `${c.cust_firstname} ${c.cust_lastname}`.toLowerCase().includes(search.toLowerCase()) ||
    c.cust_email.toLowerCase().includes(search.toLowerCase()) ||
    (c.cust_cont_no ?? "").includes(search)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: "var(--navy)" }}>Customers</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {total} customers
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="search-bar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Customer</button>
        </div>
      </div>

      {showForm && (
        <CustomerForm onClose={() => setShowForm(false)} onSaved={refetch} />
      )}

      <div className="card">
        {loading && <div className="spinner" />}
        {!loading && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Contact No.</th>
                    <th>Provider</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.cust_id}>
                      <td style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "monospace" }}>
                        {String(c.cust_id).slice(0, 8)}…
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {c.cust_lastname}, {c.cust_firstname}
                        {c.cust_middlename ? ` ${c.cust_middlename[0]}.` : ""}
                      </td>
                      <td>{c.cust_email}</td>
                      <td>{c.cust_cont_no || "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {c.cust_social_provider ?? "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {c.cust_cd && !isNaN(Date.parse(c.cust_cd))
                          ? new Date(c.cust_cd).toLocaleDateString("en-PH")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state"><p>No customers found</p></div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {total > 20 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                <span style={{ lineHeight: "36px", fontSize: 12, color: "var(--text-muted)" }}>Page {page}</span>
                <button className="btn btn-secondary" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Customer Form Modal ──────────────────────────────────────────────────────
// Matches backend CustomerCreate / CustomerBase field names exactly

function CustomerForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    cust_firstname: "",
    cust_lastname: "",
    cust_middlename: "",
    cust_email: "",
    cust_cont_no: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!form.cust_firstname || !form.cust_lastname || !form.cust_email) {
      setErr("First name, last name, and email are required.");
      return;
    }
    setSaving(true);
    try {
      await customersApi.create({
        cust_firstname: form.cust_firstname,
        cust_lastname: form.cust_lastname,
        cust_middlename: form.cust_middlename || undefined,
        cust_email: form.cust_email,
        cust_cont_no: form.cust_cont_no || undefined,
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const f = (key: keyof typeof form) => ({
    className: "form-input",
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3 style={{ marginBottom: 16, fontSize: 16, color: "var(--navy)" }}>New Customer</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input {...f("cust_firstname")} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input {...f("cust_lastname")} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Middle Name</label>
            <input {...f("cust_middlename")} />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input {...f("cust_email")} type="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Number</label>
            <input {...f("cust_cont_no")} placeholder="09xxxxxxxxx (+63 format)" />
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
  background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 500,
};