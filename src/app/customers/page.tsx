"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { customersApi } from "@/lib/api";
import type { Customer } from "@/types/mytypes";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const { data, loading, refetch } = useFetch(() => customersApi.list(page, 20), [page]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title text-[var(--navy)">Customers</h1>
          <p className="text-xs text-(--text-muted) mt-0.5">
            {data?.total ?? 0} customers
          </p>
        </div>
        <div className="flex items-center gap-10px">
          <div className="search-bar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              placeholder="Search customers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date & Time</th>
                    <th>Fulfillment</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.data ?? [])
                    .filter(c =>
                      !search ||
                      `${c.given_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
                      c.email.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((c) => (
                      <tr key={c.customer_id}>
                        <td className="text-slate-500">#{c.customer_id}</td>
                        <td className="font-bold">
                          {c.given_name} {c.middle_name ? c.middle_name[0] + "." : ""} {c.last_name} {c.suffix ?? ""}
                        </td>
                        <td className="text-xs text-slate-500">
                          {new Date(c.created_at).toLocaleDateString("en-PH")}
                        </td>
                        <td>{c.email}</td>
                        <td>{c.contact_num ?? "—"}</td>
                        <td>—</td>
                        <td>—</td>
                      </tr>
                    ))}
                  {(data?.data ?? []).length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state"><p>No customers found</p></div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {data && data.total > 20 && (
              <div className="flex gap-2 justify-end mt-4">
                <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span className="leading-9 text-xs text-slate-500">Page {page}</span>
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
    <div className="fixed inset-0 bg-black bg-opacity-45 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-7 w-full max-w-md">
        <h3 className="mb-4 text-base font-bold">New Customer</h3>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group"><label className="form-label">Given Name *</label><input {...f("given_name")} /></div>
            <div className="form-group"><label className="form-label">Last Name *</label><input {...f("last_name")} /></div>
            <div className="form-group"><label className="form-label">Middle Name</label><input {...f("middle_name")} /></div>
            <div className="form-group"><label className="form-label">Suffix</label><input {...f("suffix")} placeholder="Jr., Sr., III" /></div>
          </div>
          <div className="form-group"><label className="form-label">Email *</label><input {...f("email")} type="email" /></div>
          <div className="form-group"><label className="form-label">Contact Number</label><input {...f("contact_num")} placeholder="09xxxxxxxxx" /></div>
          {err && <p className="text-red-700 text-xs">{err}</p>}
          <div className="flex gap-2 justify-end">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}