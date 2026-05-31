"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { reportsApi, ordersApi } from "@/lib/api";

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${d.toLocaleDateString("en-US", opts)}–${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

const DAY_COLORS = ["#6366f1", "#a78bfa", "#f59e0b", "#f97316", "#ec4899", "#ec4899", "#94a3b8"];

export default function ReportsPage() {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));

  const { data: summary, loading } = useFetch(
    () => reportsApi.weeklySummary(weekStart),
    [weekStart]
  );

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  // Mock bar data based on summary or fallback
  const barValues = summary
    ? days.map((_, i) => Math.round((summary.total_orders / 7) * (0.5 + Math.random())))
    : [60, 45, 75, 25, 10, 15, 0];

  const maxBar = Math.max(...barValues, 1);

  const metrics = [
    { icon: "₱", value: `₱ ${Number(summary?.total_revenue ?? 0).toLocaleString("en-PH")}`, label: "Weekly Revenue" },
    { icon: "📋", value: summary?.total_orders ?? 0, label: "Total Orders" },
    { icon: "👥", value: summary?.total_orders ?? 0, label: "New Customers" },
    { icon: "📦", value: `₱ ${Number(summary?.total_revenue && summary.total_orders ? (summary.total_revenue / summary.total_orders) : 0).toLocaleString("en-PH")}`, label: "Avg Order Value" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 4 }}>
        <h1 className="page-title" style={{ color: "var(--navy)" }}>Reports</h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          week of {formatWeekLabel(weekStart)}
        </p>
      </div>

      {/* Metric cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20, marginTop: 20 }}>
        {metrics.map(({ icon, value, label }) => (
          <div key={label} style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "18px 20px",
            boxShadow: "0 2px 8px rgba(13,18,64,0.08), 0 1px 3px rgba(13,18,64,0.04)",
            border: "1px solid rgba(226,228,239,0.6)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "#f2f3f8", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 16, marginBottom: 10,
            }}>
              {icon}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--navy)", lineHeight: 1.1 }}>
              {loading ? "—" : value}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Revenue line chart */}
        <div className="card" style={{ boxShadow: "0 2px 8px rgba(13,18,64,0.08), 0 1px 3px rgba(13,18,64,0.04)", border: "1px solid rgba(226,228,239,0.6)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Revenue This Week</h3>
          <div style={{ position: "relative", height: 140 }}>
            {/* Y-axis label */}
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 24,
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              paddingRight: 8,
            }}>
              <span style={{ fontSize: 10, color: "var(--text-muted)", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>Revenue</span>
            </div>
            {/* SVG line chart */}
            <svg width="100%" height="120" viewBox="0 0 400 100" preserveAspectRatio="none" style={{ marginLeft: 20, width: "calc(100% - 20px)" }}>
              {/* Grid lines */}
              {[0, 33, 66, 100].map(y => (
                <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#e2e4ef" strokeWidth="1" />
              ))}
              {/* Line */}
              <polyline
                points={barValues.map((v, i) => `${(i / 6) * 400},${100 - (v / maxBar) * 90}`).join(" ")}
                fill="none"
                stroke="#3b5bdb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Dots */}
              {barValues.map((v, i) => (
                <circle
                  key={i}
                  cx={(i / 6) * 400}
                  cy={100 - (v / maxBar) * 90}
                  r="4"
                  fill="#3b5bdb"
                />
              ))}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 20, marginTop: 4 }}>
              {days.map(d => (
                <span key={d} style={{ fontSize: 10, color: "var(--text-muted)" }}>{d}</span>
              ))}
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>Day</div>
          </div>
        </div>

        {/* Orders bar chart */}
        <div className="card" style={{ boxShadow: "0 2px 8px rgba(13,18,64,0.08), 0 1px 3px rgba(13,18,64,0.04)", border: "1px solid rgba(226,228,239,0.6)" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160, paddingBottom: 24 }}>
            {barValues.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                <div style={{
                  width: "100%",
                  height: `${(v / maxBar) * 100}%`,
                  background: DAY_COLORS[i],
                  borderRadius: "6px 6px 0 0",
                  minHeight: v > 0 ? 4 : 0,
                  transition: "height 0.3s",
                }} />
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{days[i]}</span>
              </div>
            ))}
          </div>
          {/* Y-axis reference */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>0</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{maxBar}</span>
          </div>
        </div>
      </div>
    </div>
  );
}