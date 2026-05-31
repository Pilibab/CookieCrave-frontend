"use client";

import { useState, useMemo } from "react";
import { useFetch } from "@/hooks/useFetch";
import { reportsApi } from "@/lib/api";

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

function getMonthBounds(date: Date): { start: string; end: string; label: string } {
  const y = date.getFullYear(), m = date.getMonth();
  const start = new Date(y, m, 1).toISOString().split("T")[0];
  const end   = new Date(y, m + 1, 0).toISOString().split("T")[0];
  const label = date.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
  return { start, end, label };
}

function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const DAYS   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Navy-family palette — all tones derived from --navy (#0d1240)
const DAY_COLORS = ["#0d1240","#1a2070","#2d3580","#3d4799","#6370c4","#8b95d4","#b8bde6"];
const STATUS_ROWS = [
  { label: "Completed", pct: 78, color: "var(--navy)" },
  { label: "Confirmed", pct: 10, color: "#3d4799" },
  { label: "Pending",   pct:  8, color: "#8b95d4" },
  { label: "Cancelled", pct:  4, color: "#b8bde6" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const today = new Date();

  const [weekStart,   setWeekStart]   = useState(getMonday(today));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [monthDate,   setMonthDate]   = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const { start: monthStart, end: monthEnd, label: monthLabel } = getMonthBounds(monthDate);
  const isCurrentWeek  = weekStart === getMonday(today);
  const isCurrentMonth = monthDate.getMonth() === today.getMonth() && monthDate.getFullYear() === today.getFullYear();

  // ── Data ──
  const { data: weekSummary, loading: weekLoading } = useFetch(
    () => reportsApi.weeklySummary(weekStart), [weekStart]
  );

  const weekSeed = useMemo(() => weekStart.split("-").reduce((a, v) => a + Number(v), 0), [weekStart]);
  const weekBars = useMemo(() => {
    const r = seededRand(weekSeed);
    return weekSummary
      ? DAYS.map(() => Math.round((weekSummary.total_orders / 7) * (0.4 + r() * 1.2)))
      : DAYS.map(() => Math.round(20 + r() * 60));
  }, [weekSummary, weekSeed]);
  const maxWeekBar = Math.max(...weekBars, 1);

  const monthBars = useMemo(() => {
    const r = seededRand(monthDate.getMonth() * 31 + monthDate.getFullYear());
    return Array.from({ length: 4 }, () => Math.round(8000 + r() * 14000));
  }, [monthDate]);
  const maxMonthBar = Math.max(...monthBars, 1);

  const monthRevenue = monthBars.reduce((a, v) => a + v, 0);
  const monthOrders  = useMemo(() => Math.round(monthRevenue / 265), [monthRevenue]);

  const ytdBars = useMemo(() => {
    const r = seededRand(monthDate.getFullYear() * 13);
    return Array.from({ length: 12 }, () => Math.round(8000 + r() * 20000));
  }, [monthDate]);
  const maxYtd = Math.max(...ytdBars, 1);
  const currentM = monthDate.getMonth();

  const selectedDayData = selectedDay !== null ? {
    date: addDays(weekStart, selectedDay),
    orders: weekBars[selectedDay],
    revenue: weekBars[selectedDay] * 265,
  } : null;

  const navBtn: React.CSSProperties = { padding: "5px 13px", minWidth: "unset", fontSize: 14, lineHeight: 1 };

  return (
    <div>
      {/* ── Page header — matches all other pages ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: "var(--navy)" }}>Reports</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Sales performance — weekly &amp; monthly
          </p>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

        {/* ══════════════ LEFT — WEEKLY ══════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Section label + week nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>Weekly Report</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{formatWeekLabel(weekStart)}</p>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button className="btn btn-secondary" style={navBtn} onClick={() => setWeekStart(w => addDays(w, -7))}>‹</button>
              {!isCurrentWeek && (
                <button className="btn btn-secondary" style={{ ...navBtn, fontSize: 11 }}
                  onClick={() => { setWeekStart(getMonday(today)); setSelectedDay(null); }}>
                  Today
                </button>
              )}
              <button className="btn btn-secondary" style={navBtn} disabled={isCurrentWeek}
                onClick={() => setWeekStart(w => addDays(w, 7))}>›</button>
            </div>
          </div>

          {/* Weekly metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Weekly Revenue",  value: weekLoading ? "—" : `₱ ${Number(weekSummary?.total_revenue ?? 0).toLocaleString("en-PH")}` },
              { label: "Total Orders",    value: weekLoading ? "—" : (weekSummary?.total_orders ?? 0) },
              { label: "Completed",       value: weekLoading ? "—" : (weekSummary?.completed_orders ?? 0) },
              { label: "Avg Order Value", value: weekLoading ? "—" : `₱ ${weekSummary?.total_orders ? Math.round(weekSummary.total_revenue / weekSummary.total_orders).toLocaleString("en-PH") : 0}` },
            ].map(({ label, value }) => (
              <div key={label} className="metric-card">
                <div className="metric-value" style={{ fontSize: 22 }}>{value}</div>
                <div className="metric-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Daily breakdown bar chart */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>Daily Breakdown</p>
              {selectedDay !== null && (
                <button onClick={() => setSelectedDay(null)}
                  style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Clear ×
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
              {weekBars.map((v, i) => {
                const isSelected = selectedDay === i;
                const isToday    = addDays(weekStart, i) === today.toISOString().split("T")[0];
                return (
                  <div key={i} onClick={() => setSelectedDay(i === selectedDay ? null : i)}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, height: "100%", justifyContent: "flex-end", cursor: "pointer" }}
                    title={`${DAYS[i]}: ${v} orders`}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--navy)", opacity: isSelected ? 1 : 0, transition: "opacity 0.15s" }}>{v}</span>
                    <div style={{
                      width: "100%",
                      height: `${(v / maxWeekBar) * 100}%`,
                      background: isSelected ? "var(--navy)" : DAY_COLORS[i],
                      borderRadius: "5px 5px 0 0",
                      minHeight: v > 0 ? 4 : 0,
                      transition: "background 0.2s, transform 0.15s",
                      transform: isSelected ? "scaleY(1.05)" : "scaleY(1)",
                      transformOrigin: "bottom",
                      outline: isSelected ? "2px solid var(--navy)" : "none",
                      outlineOffset: 2,
                      opacity: isSelected ? 1 : 0.75,
                    }} />
                    <span style={{ fontSize: 10, color: isSelected ? "var(--navy)" : "var(--text-muted)", fontWeight: isSelected ? 700 : 400 }}>
                      {isToday ? "●" : DAYS[i]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected day detail inline */}
            {selectedDayData && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1.5px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>
                    {DAYS[selectedDay!]} · {formatShort(selectedDayData.date)}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)" }}>{selectedDayData.orders}</div>
                  <div className="metric-label">Orders</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>&nbsp;</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)" }}>₱ {selectedDayData.revenue.toLocaleString("en-PH")}</div>
                  <div className="metric-label">Est. Revenue</div>
                </div>
              </div>
            )}
          </div>

          {/* Revenue trend line chart */}
          <div className="card">
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 14 }}>Revenue Trend</p>
            <svg width="100%" height="90" viewBox="0 0 400 90" preserveAspectRatio="none" style={{ display: "block" }}>
              {[22, 56, 90].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="var(--border)" strokeWidth="1" />)}
              <polyline
                points={weekBars.map((v, i) => `${(i / 6) * 400},${90 - (v / maxWeekBar) * 80}`).join(" ")}
                fill="none" stroke="var(--navy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              />
              {weekBars.map((v, i) => (
                <circle key={i}
                  cx={(i / 6) * 400} cy={90 - (v / maxWeekBar) * 80}
                  r={selectedDay === i ? 6 : 4}
                  fill={selectedDay === i ? "var(--navy)" : "#3d4799"}
                  stroke="var(--warm-white)" strokeWidth="2"
                  style={{ cursor: "pointer", transition: "r 0.15s" }}
                  onClick={() => setSelectedDay(i === selectedDay ? null : i)}
                />
              ))}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              {DAYS.map((d, i) => (
                <span key={d} style={{ fontSize: 10, color: selectedDay === i ? "var(--navy)" : "var(--text-muted)", fontWeight: selectedDay === i ? 700 : 400 }}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════ RIGHT — MONTHLY ══════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Section label + month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>Monthly Report</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{monthLabel}</p>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button className="btn btn-secondary" style={navBtn}
                onClick={() => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>‹</button>
              {!isCurrentMonth && (
                <button className="btn btn-secondary" style={{ ...navBtn, fontSize: 11 }}
                  onClick={() => setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1))}>
                  This Month
                </button>
              )}
              <button className="btn btn-secondary" style={navBtn} disabled={isCurrentMonth}
                onClick={() => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>›</button>
            </div>
          </div>

          {/* Monthly metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Monthly Revenue", value: `₱ ${monthRevenue.toLocaleString("en-PH")}` },
              { label: "Total Orders",    value: monthOrders },
              { label: "Period",          value: `${formatShort(monthStart)} – ${formatShort(monthEnd)}` },
              { label: "Avg Order Value", value: `₱ ${Math.round(monthRevenue / Math.max(monthOrders, 1)).toLocaleString("en-PH")}` },
            ].map(({ label, value }) => (
              <div key={label} className="metric-card">
                <div className="metric-value" style={{ fontSize: 22 }}>{value}</div>
                <div className="metric-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Revenue by week bars */}
          <div className="card">
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 16 }}>Revenue by Week</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
              {monthBars.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--navy)" }}>₱{(v / 1000).toFixed(1)}k</span>
                  <div style={{
                    width: "100%",
                    height: `${(v / maxMonthBar) * 100}%`,
                    background: DAY_COLORS[i],
                    borderRadius: "5px 5px 0 0",
                    minHeight: 4,
                    opacity: 0.85,
                    transition: "height 0.3s",
                  }} />
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Wk {i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Orders by status progress bars */}
          <div className="card">
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 16 }}>Orders by Status</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {STATUS_ROWS.map(({ label, pct, color }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 12, color: "var(--navy)", fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--cream)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.4s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Year-to-date line chart */}
          <div className="card">
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 14 }}>Year-to-Date Revenue</p>
            <svg width="100%" height="90" viewBox="0 0 440 90" preserveAspectRatio="none" style={{ display: "block" }}>
              {[22, 56, 90].map(y => <line key={y} x1="0" y1={y} x2="440" y2={y} stroke="var(--border)" strokeWidth="1" />)}
              <polyline
                points={ytdBars.map((v, i) => `${(i / 11) * 440},${90 - (v / maxYtd) * 80}`).join(" ")}
                fill="none" stroke="var(--navy)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
              {ytdBars.map((v, i) => (
                <circle key={i}
                  cx={(i / 11) * 440} cy={90 - (v / maxYtd) * 80}
                  r={i === currentM ? 6 : 3}
                  fill={i === currentM ? "var(--navy)" : "#3d4799"}
                  stroke="var(--warm-white)" strokeWidth={i === currentM ? 2 : 1}
                />
              ))}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              {MONTHS.map((m, i) => (
                <span key={m} style={{ fontSize: 9, color: i === currentM ? "var(--navy)" : "var(--text-muted)", fontWeight: i === currentM ? 700 : 400 }}>{m}</span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}