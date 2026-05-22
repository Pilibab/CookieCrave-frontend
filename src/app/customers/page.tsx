"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { customersApi } from "@/lib/api";
import type { Customer } from "@/types";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const { data, loading, refetch } = useFetch(() => customersApi.list(page, 20), [page]);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="page-body">
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Customer</button>
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
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.data ?? []).map((c) => (
                    <tr key={c.customer_id}>
                      <td style={{ color: "#6b6f8a" }}>#{c.customer_id}</td>
                      <td style={{ fontWeight: 600 }}>
                        {c.given_name} {c.middle_name ? c.middle_name[0] + "." : ""} {c.last_name} {c.suffix ?? ""}
                      </td>
                      <td>{c.email}</td>
                      <td>{c.contact_num ?? "—"}</td>
                      <td style={{ fontSize: 13, color: "#6b6f8a" }}>
                        {new Date(c.created_at).toLocaleDateString("en-PH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && data.total > 20 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ lineHeight: "36px", fontSize: 13, color: "#6b6f8a" }}>Page {page}</span>
                <button className="btn btn-secondary" disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CustomerForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    last_name: "", given_name: "", middle_name: "", suffix: "",
    email: "", contact_num: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!form.last_name || !form.given_name || !form.email) {
      setErr("Last name, given name and email are required."); return;
    }
    setSaving(true);
    try {
      await customersApi.create(form);
      onSaved(); onClose();
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
        <h3 style={{ marginBottom: 16 }}>New Customer</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group"><label className="form-label">Given Name *</label><input {...f("given_name")} /></div>
            <div className="form-group"><label className="form-label">Last Name *</label><input {...f("last_name")} /></div>
            <div className="form-group"><label className="form-label">Middle Name</label><input {...f("middle_name")} /></div>
            <div className="form-group"><label className="form-label">Suffix</label><input {...f("suffix")} placeholder="Jr., Sr., III" /></div>
          </div>
          <div className="form-group"><label className="form-label">Email *</label><input {...f("email")} type="email" /></div>
          <div className="form-group"><label className="form-label">Contact Number</label><input {...f("contact_num")} placeholder="09xxxxxxxxx" /></div>
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

const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 };
const modal: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: 28, width: "100%", maxWidth: 500 };
