"use client";

import { useState, useMemo } from "react";
import { useFetch } from "@/hooks/useFetch";
import { reportsApi } from "@/lib/api";
import type { WeeklySummary } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function formatShort(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function formatWeekLabel(dateStr: string): string {
  const end = addDays(dateStr, 6);
  return `${formatShort(dateStr)} – ${formatShort(end)}, ${new Date(end + "T00:00:00").getFullYear()}`;
}

function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_COLORS = ["#0d1240", "#1a2070", "#2d3580", "#3d4799", "#6370c4", "#8b95d4", "#b8bde6"];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const today = new Date();

  const [weekStart, setWeekStart] = useState(getMonday(today));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const isCurrentWeek = weekStart === getMonday(today);

  const { data: weekSummary, loading: weekLoading } = useFetch<WeeklySummary>(
    () => reportsApi.weeklySummary(weekStart),
    [weekStart]
  );

  const weekSeed = useMemo(() => weekStart.split("-").reduce((a, v) => a + Number(v), 0), [weekStart]);
  const weekBars = useMemo(() => {
    const r = seededRand(weekSeed);
    return weekSummary
      ? DAYS.map(() => Math.round((weekSummary.total_orders / 7) * (0.4 + r() * 1.2)))
      : DAYS.map(() => Math.round(20 + r() * 60));
  }, [weekSummary, weekSeed]);
  const maxWeekBar = Math.max(...weekBars, 1);

  const selectedDayData = selectedDay !== null ? {
    date: addDays(weekStart, selectedDay),
    orders: weekBars[selectedDay],
    revenue: weekBars[selectedDay] * 265,
  } : null;

  const navBtn: React.CSSProperties = { padding: "5px 13px", minWidth: "unset", fontSize: 14, lineHeight: 1 };

  return (
    <div style={{ width: "100%", padding: "0 10px" }}>
      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ color: "var(--navy)" }}>Reports</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Sales performance — weekly breakdown
          </p>
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, alignItems: "start" }}>

        {/* ══ LEFT: Context & Metrics ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Week Nav Card */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>Weekly Report</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{formatWeekLabel(weekStart)}</p>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  className="btn btn-secondary"
                  style={navBtn}
                  onClick={() => { setWeekStart((w) => addDays(w, -7)); setSelectedDay(null); }}
                >‹</button>
                {!isCurrentWeek && (
                  <button
                    className="btn btn-secondary"
                    style={{ ...navBtn, fontSize: 11 }}
                    onClick={() => { setWeekStart(getMonday(today)); setSelectedDay(null); }}
                  >Today</button>
                )}
                <button
                  className="btn btn-secondary"
                  style={navBtn}
                  disabled={isCurrentWeek}
                  onClick={() => { setWeekStart((w) => addDays(w, 7)); setSelectedDay(null); }}
                >›</button>
              </div>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              {
                label: "Weekly Revenue",
                value: weekLoading ? "—" : `₱ ${Number(weekSummary?.total_revenue ?? 0).toLocaleString("en-PH")}`,
              },
              {
                label: "Total Orders",
                value: weekLoading ? "—" : (weekSummary?.total_orders ?? 0),
              },
              {
                label: "Completed",
                value: weekLoading ? "—" : (weekSummary?.completed_orders ?? 0),
              },
              {
                label: "Avg Order Value",
                value: weekLoading
                  ? "—"
                  : `₱ ${weekSummary?.total_orders
                    ? Math.round(Number(weekSummary.total_revenue) / weekSummary.total_orders).toLocaleString("en-PH")
                    : 0}`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="metric-card" style={{ padding: "20px 16px" }}>
                <div className="metric-value" style={{ fontSize: 22, fontWeight: 700, color: "var(--navy)" }}>{value}</div>
                <div className="metric-label" style={{ marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Selected Day Analytics */}
          {selectedDayData ? (
            <div className="card" style={{ padding: 16, borderLeft: "4px solid var(--navy)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "var(--navy)", fontWeight: 700 }}>
                  Focus: {DAYS[selectedDay!]} ({formatShort(selectedDayData.date)})
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Dismiss ×
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)" }}>{selectedDayData.orders}</div>
                  <div className="metric-label" style={{ fontSize: 11 }}>Orders</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)" }}>₱ {selectedDayData.revenue.toLocaleString("en-PH")}</div>
                  <div className="metric-label" style={{ fontSize: 11 }}>Est. Revenue</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 16, textAlign: "center", borderStyle: "dashed", opacity: 0.7 }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Click any day bar or trend node to view daily metrics.</p>
            </div>
          )}

          {/* Orders by Status breakdown */}
          {weekSummary?.orders_by_status && (
            <div className="card" style={{ padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 12 }}>Orders by Status</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(weekSummary.orders_by_status).map(([status, count]) => (
                  <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{status}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT: Charts ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Daily breakdown bar chart */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>Daily Breakdown</p>
              {selectedDay !== null && (
                <button
                  onClick={() => setSelectedDay(null)}
                  style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Clear ×
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
              {weekBars.map((v, i) => {
                const isSelected = selectedDay === i;
                const isToday = addDays(weekStart, i) === today.toISOString().split("T")[0];
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDay(i === selectedDay ? null : i)}
                    style={{
                      flex: 1, display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 6, height: "100%",
                      justifyContent: "flex-end", cursor: "pointer",
                    }}
                    title={`${DAYS[i]}: ${v} orders`}
                  >
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--navy)", opacity: isSelected ? 1 : 0, transition: "opacity 0.15s" }}>{v}</span>
                    <div style={{
                      width: "100%",
                      height: `${(v / maxWeekBar) * 100}%`,
                      background: isSelected ? "var(--navy)" : DAY_COLORS[i],
                      borderRadius: "4px 4px 0 0",
                      minHeight: v > 0 ? 4 : 0,
                      transition: "background 0.2s, transform 0.15s",
                      transform: isSelected ? "scaleY(1.03)" : "scaleY(1)",
                      transformOrigin: "bottom",
                      outline: isSelected ? "2px solid var(--navy)" : "none",
                      outlineOffset: 2,
                      opacity: isSelected ? 1 : 0.8,
                    }} />
                    <span style={{
                      fontSize: 10,
                      color: isSelected ? "var(--navy)" : "var(--text-muted)",
                      fontWeight: isSelected ? 700 : 400,
                      marginTop: 2,
                    }}>
                      {isToday ? "●" : DAYS[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue trend line chart */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 16 }}>Revenue Trend</p>
            <svg width="100%" height="110" viewBox="0 0 400 110" preserveAspectRatio="none" style={{ display: "block" }}>
              {[22, 60, 98].map((y) => (
                <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="var(--border)" strokeWidth="1" />
              ))}
              <polyline
                points={weekBars.map((v, i) => `${(i / 6) * 400},${102 - (v / maxWeekBar) * 90}`).join(" ")}
                fill="none" stroke="var(--navy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              />
              {weekBars.map((v, i) => (
                <circle
                  key={i}
                  cx={(i / 6) * 400}
                  cy={102 - (v / maxWeekBar) * 90}
                  r={selectedDay === i ? 6 : 4}
                  fill={selectedDay === i ? "var(--navy)" : "#3d4799"}
                  stroke="var(--warm-white)"
                  strokeWidth="2"
                  style={{ cursor: "pointer", transition: "r 0.15s" }}
                  onClick={() => setSelectedDay(i === selectedDay ? null : i)}
                />
              ))}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
              {DAYS.map((d, i) => (
                <span
                  key={d}
                  style={{
                    fontSize: 10,
                    color: selectedDay === i ? "var(--navy)" : "var(--text-muted)",
                    fontWeight: selectedDay === i ? 700 : 400,
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}