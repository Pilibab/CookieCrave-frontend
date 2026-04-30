"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { reportsApi } from "@/lib/api";

// Helper: get Monday of a given week
function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default function ReportsPage() {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));

  const { data: summary, loading } = useFetch(
    () => reportsApi.weeklySummary(weekStart),
    [weekStart]
  );

  return (
    <div className="page-body">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#6b6f8a" }}>Week of</label>
          <input
            type="date"
            className="form-input"
            style={{ width: "auto" }}
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
          />
        </div>
      </div>

      {loading && <div className="spinner" />}

      {!loading && summary && (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatCard label="Total Orders" value={String(summary.total_orders)} color="#0d1240" />
            <StatCard label="Completed" value={String(summary.completed_orders)} color="#27ae60" />
            <StatCard label="Completion Rate"
              value={summary.total_orders > 0
                ? `${Math.round((summary.completed_orders / summary.total_orders) * 100)}%`
                : "—"}
              color="#c8883a"
            />
            <StatCard
              label="Total Revenue"
              value={`₱${Number(summary.total_revenue).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              color="#c8883a"
            />
          </div>

          {/* Orders by status */}
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Orders by Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(summary.orders_by_status).map(([status, count]) => {
                const pct = summary.total_orders > 0 ? (count / summary.total_orders) * 100 : 0;
                return (
                  <div key={status} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 130, fontSize: 13, fontWeight: 500 }}>{status}</span>
                    <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 10 }}>
                      <div style={{ width: `${pct}%`, background: "#0d1240", borderRadius: 4, height: "100%", transition: "width 0.4s" }} />
                    </div>
                    <span style={{ width: 40, textAlign: "right", fontSize: 13, fontWeight: 600 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Print hint */}
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              🖨 Print Report
            </button>
          </div>
        </>
      )}

      {!loading && !summary && (
        <div className="empty-state">
          <p>No data available for the selected week.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#6b6f8a", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color, margin: "6px 0 0", fontFamily: "'DM Serif Display', serif" }}>{value}</p>
    </div>
  );
}
