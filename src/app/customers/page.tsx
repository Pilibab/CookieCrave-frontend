"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { customersApi } from "@/lib/api";
import type { Customer } from "@/types";


export default function CustomersPage() {
  // 1. Simplified Fetch: Directly expects an array from the API
  const { data: customers = [], loading, refetch } = useFetch<Customer[]>(customersApi.list);
  
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  // 2. Simplified Counts & Filters
  const total = customers?.length;

  const filtered = customers?.filter((c) =>
    !search ||
    `${c.cust_firstname} ${c.cust_lastname}`.toLowerCase().includes(search.toLowerCase()) ||
    c.cust_email.toLowerCase().includes(search.toLowerCase()) ||
    (c.cust_cont_no ?? "").includes(search)
  );

  return (
    <div style={containerStyle}>
      <div style={backgroundWrapperStyle} />
      <div style={luxuryScrimOverlayStyle} />

      <div style={contentWrapperStyle}>
        {/* Sleek Low-Profile Header */}
        <div style={headerContainerStyle}>
          <div>
            <h1 style={titleStyle}>Customers Registry</h1>
            <p style={subtitleStyle}>{total} verified accounts logged</p>
          </div>
          
          <div style={actionGroupStyle}>
            {/* Elegant Glass Search Input Component */}
            <div style={searchContainerStyle}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={searchIconStyle}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Filter profiles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={searchInputStyle}
              />
            </div>
            <button style={primaryBtnStyle} onClick={() => setShowForm(true)}>
              + Add Customer
            </button>
          </div>
        </div>

        {showForm && (
          <CustomerForm onClose={() => setShowForm(false)} onSaved={refetch} />
        )}

        {/* Unified Frosted Glass Panel Workspace */}
        <main style={mainGlassPanelStyle}>
          {loading && <div style={statusMessageStyle}>Retrieving customer catalog records...</div>}
          
          {!loading && (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Full Name</th>
                    <th style={thStyle}>Email Address</th>
                    <th style={thStyle}>Contact No.</th>
                    <th style={thStyle}>Provider</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((c) => (
                    <tr key={c.cust_id} style={tableRowStyle}>
                      <td style={{ ...tdStyle, color: "#C8883A", fontSize: "11px", fontFamily: "monospace" }}>
                        {String(c.cust_id).slice(0, 8).toUpperCase()}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: "#FFFFFF" }}>
                        {c.cust_lastname}, {c.cust_firstname}
                        {c.cust_middlename ? ` ${c.cust_middlename[0]}.` : ""}
                      </td>
                      <td style={tdStyle}>{c.cust_email}</td>
                      <td style={tdStyle}>{c.cust_cont_no || "—"}</td>
                      <td style={{ ...tdStyle, fontSize: "13px", color: "#94a3b8", textTransform: "capitalize" }}>
                        {c.cust_social_provider ?? "Standard"}
                      </td>
                      <td style={{ ...tdStyle, fontSize: "13px", color: "#94a3b8", textAlign: "right" }}>
                        {c.cust_cd && !isNaN(Date.parse(c.cust_cd))
                          ? new Date(c.cust_cd).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {filtered?.length === 0 && (
                    <tr>
                      <td colSpan={6} style={emptyTableStyle}>
                        No custom client listings detected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Ensure your CustomerForm component remains below this exactly as it was!

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

  const inputProps = (key: keyof typeof form) => ({
    style: modalInputStyle,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={modalTitleStyle}>New Customer Profile</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input {...inputProps("cust_firstname")} placeholder="e.g., Jane" />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input {...inputProps("cust_lastname")} placeholder="e.g., Doe" />
            </div>
          </div>
          
          <div>
            <label style={labelStyle}>Middle Name</label>
            <input {...inputProps("cust_middlename")} placeholder="Optional" />
          </div>
          
          <div>
            <label style={labelStyle}>Email Address *</label>
            <input {...inputProps("cust_email")} type="email" placeholder="name@domain.com" />
          </div>
          
          <div>
            <label style={labelStyle}>Contact Number</label>
            <input {...inputProps("cust_cont_no")} placeholder="09xxxxxxxxx" />
          </div>
          
          {err && <p style={errorTextStyle}>{err}</p>}
          
          <div style={modalActionRowStyle}>
            <button style={secondaryBtnStyle} onClick={onClose}>Cancel</button>
            <button style={primaryBtnStyle} onClick={handleSave} disabled={saving}>
              {saving ? "Saving Profile..." : "Save Record"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MODERN EXECUTIVE DESIGN SYSTEM STYLES ─── */
const containerStyle: React.CSSProperties = {
  position: "relative",
  minHeight: "calc(100vh - var(--navbar-h, 60px))",
  overflowY: "auto",
  padding: "24px 32px",
  backgroundColor: "#080605",
  fontFamily: "system-ui, -apple-system, sans-serif",
  color: "#FFFFFF"
};

const backgroundWrapperStyle: React.CSSProperties = {
  position: "fixed",
  top: "var(--navbar-h, 60px)",
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: "url('/Customers-bg.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  opacity: 1.0, 
  zIndex: 0,
  pointerEvents: "none"
};

const luxuryScrimOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: "var(--navbar-h, 60px)",
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(8, 6, 5, 0.7)", 
  zIndex: 1,
  pointerEvents: "none"
};

const contentWrapperStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  maxWidth: "1340px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "20px"
};

const headerContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "26px",
  fontWeight: "normal",
  fontFamily: "Georgia, serif", 
  color: "#FFFFFF",
};

const subtitleStyle: React.CSSProperties = {
  margin: "2px 0 0 0",
  fontSize: "12px",
  color: "#64748b",
};

const actionGroupStyle: React.CSSProperties = {
  display: "flex", 
  gap: "12px",
  alignItems: "center",
  flexWrap: "wrap"
};

const searchContainerStyle: React.CSSProperties = {
  position: "relative",
  minWidth: "240px"
};

const searchIconStyle: React.CSSProperties = {
  position: "absolute",
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none"
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px 8px 34px",
  borderRadius: "4px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  backgroundColor: "rgba(20, 18, 16, 0.75)",
  fontSize: "13px",
  color: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box"
};

const primaryBtnStyle: React.CSSProperties = {
  backgroundColor: "#C8883A", 
  color: "#FFFFFF",
  padding: "8px 16px",
  borderRadius: "4px",
  fontWeight: 600,
  fontSize: "12px",
  textDecoration: "none",
  boxShadow: "0 4px 12px rgba(200, 136, 58, 0.15)",
  border: "none",
  cursor: "pointer"
};

const mainGlassPanelStyle: React.CSSProperties = {
  backgroundColor: "rgba(20, 18, 16, 0.82)",
  backdropFilter: "blur(16px)", 
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "6px",
  padding: "20px 24px",
  boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left"
};

const tableHeaderRowStyle: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.08)"
};

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: "10px",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.03)"
};

const tdStyle: React.CSSProperties = {
  padding: "14px 12px",
  fontSize: "13px",
  color: "#cbd5e1"
};

const emptyTableStyle: React.CSSProperties = {
  padding: "40px",
  textAlign: "center",
  color: "#64748b",
  fontSize: "13px",
  fontStyle: "italic"
};

const paginationRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "16px",
};

const paginationInfoStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#64748b"
};

const pagingBtnStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#FFFFFF",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  padding: "4px 12px",
  borderRadius: "3px",
  fontSize: "12px",
  cursor: "pointer",
};

const disablePagingBtnStyle: React.CSSProperties = {
  ...pagingBtnStyle,
  color: "rgba(255,255,255,0.15)",
  borderColor: "rgba(255,255,255,0.03)",
  cursor: "not-allowed"
};

const statusMessageStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "24px",
  fontSize: "13px",
  color: "#64748b"
};

/* Modal Form Architectural Glass Layouts */
const overlayStyle: React.CSSProperties = { 
  position: "fixed", 
  inset: 0, 
  backgroundColor: "rgba(8, 6, 5, 0.6)", 
  backdropFilter: "blur(8px)",
  display: "flex", 
  alignItems: "center", 
  justifyContent: "center", 
  zIndex: 200 
};

const modalStyle: React.CSSProperties = { 
  backgroundColor: "rgba(20, 18, 16, 0.95)", 
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "8px", 
  padding: "28px", 
  width: "100%", 
  maxWidth: "460px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
};

const modalTitleStyle: React.CSSProperties = {
  margin: "0 0 20px 0",
  fontSize: "18px",
  fontWeight: "normal",
  fontFamily: "Georgia, serif",
  color: "#FFFFFF"
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "6px"
};

const modalInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "4px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  backgroundColor: "rgba(8, 6, 5, 0.5)",
  fontSize: "14px",
  color: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box"
};

const errorTextStyle: React.CSSProperties = {
  color: "#fca5a5",
  fontSize: "13px",
  fontWeight: 600,
  margin: "4px 0"
};

const modalActionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  justifyContent: "flex-end",
  marginTop: "12px"
};

const secondaryBtnStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#FFFFFF",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  padding: "8px 16px",
  borderRadius: "3px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer"
};