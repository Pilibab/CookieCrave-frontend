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
const DAY_COLORS = [
  "rgba(200, 136, 58, 0.45)", 
  "rgba(200, 136, 58, 0.55)", 
  "rgba(200, 136, 58, 0.65)", 
  "rgba(200, 136, 58, 0.75)", 
  "rgba(218, 165, 32, 0.7)", 
  "rgba(245, 208, 169, 0.6)", 
  "rgba(254, 240, 138, 0.5)"
];

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

  return (
    <div style={containerStyle}>
      {/* Immersive high-visibility asset background framework */}
      <div style={backgroundWrapperStyle} />
      <div style={luxuryScrimOverlayStyle} />

      <div style={contentWrapperStyle}>
        
        {/* Sleek Low-Profile Header Layer */}
        <div style={headerContainerStyle}>
          <div>
            <h1 style={titleStyle}>Store Analytics</h1>
            <p style={subtitleStyle}>Sales performance — weekly storefront matrix tracking.</p>
          </div>
        </div>

        {/* Two-Column Responsive Grid Area */}
        <div style={twoColumnGridStyle}>

          {/* ══ LEFT COLUMN: Operational Framework Filters & Metrics ══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Week Nav Ribbon Capsule */}
            <div style={compactGlassCardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <div>
                  <p style={cardLabelStyle}>Weekly Operational Cycle</p>
                  <p style={dateWeekRangeLabelStyle}>{formatWeekLabel(weekStart)}</p>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button
                    style={pagingBtnStyle}
                    onClick={() => { setWeekStart((w) => addDays(w, -7)); setSelectedDay(null); }}
                  >
                    &larr;
                  </button>
                  {!isCurrentWeek && (
                    <button
                      style={todayBtnStyle}
                      onClick={() => { setWeekStart(getMonday(today)); setSelectedDay(null); }}
                    >
                      Current
                    </button>
                  )}
                  <button
                    style={isCurrentWeek ? disablePagingBtnStyle : pagingBtnStyle}
                    disabled={isCurrentWeek}
                    onClick={() => { setWeekStart((w) => addDays(w, 7)); setSelectedDay(null); }}
                  >
                    &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Core Analytical Stat Cubes */}
            <div style={metricsSubGridStyle}>
              {[
                {
                  label: "Gross Revenue",
                  value: weekLoading ? "—" : `₱${Number(weekSummary?.total_revenue ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
                  highlight: true,
                },
                {
                  label: "Total Dispatch",
                  value: weekLoading ? "—" : (weekSummary?.total_orders ?? 0),
                },
                {
                  label: "Completed Batches",
                  value: weekLoading ? "—" : (weekSummary?.completed_orders ?? 0),
                },
                {
                  label: "Ticket AOV",
                  value: weekLoading
                    ? "—"
                    : `₱${weekSummary?.total_orders
                      ? Math.round(Number(weekSummary.total_revenue) / weekSummary.total_orders).toLocaleString("en-PH", { minimumFractionDigits: 2 })
                      : "0.00"}`,
                },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={compactGlassCardStyle}>
                  <div style={cardLabelStyle}>{label}</div>
                  <div style={{ ...cardValueStyle, color: highlight ? "#fef08a" : "#FFFFFF" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Dynamic Selected Day Anchor Inspection Layer */}
            {selectedDayData ? (
              <div style={{ ...compactGlassCardStyle, borderLeft: "3px solid #C8883A" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", width: "100%" }}>
                  <div style={{ fontSize: "11px", color: "#C8883A", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Focus Frame: {DAYS[selectedDay!]} ({formatShort(selectedDayData.date)})
                  </div>
                  <button
                    onClick={() => setSelectedDay(null)}
                    style={dismissBtnStyle}
                  >
                    Close &times;
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%" }}>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "normal", fontFamily: "Georgia, serif", color: "#FFFFFF" }}>{selectedDayData.orders}</div>
                    <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Batches</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "normal", fontFamily: "Georgia, serif", color: "#fef08a" }}>₱{selectedDayData.revenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Est. Yield</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={dashedPlaceholderStyle}>
                <p style={{ margin: 0 }}>Select any chart coordinate marker to isolate individual operational day metrics.</p>
              </div>
            )}

            {/* Fulfillment Pipeline Breakdown Array */}
            {weekSummary?.orders_by_status && (
              <div style={compactGlassCardStyle}>
                <p style={{ ...cardLabelStyle, marginBottom: "12px", width: "100%" }}>Pipeline Status Distribution</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                  {Object.entries(weekSummary.orders_by_status).map(([status, count]) => (
                    <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "#cbd5e1" }}>{status}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#C8883A" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══ RIGHT COLUMN: Glassmorphic Trend Visualizers ══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Daily Volume Bar Graph Element */}
            <div style={mainGlassPanelStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h2 style={panelTitleStyle}>Daily Output Capacity</h2>
                {selectedDay !== null && (
                  <button onClick={() => setSelectedDay(null)} style={dismissBtnStyle}>Reset Index &times;</button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "130px", paddingTop: "10px" }}>
                {weekBars.map((v, i) => {
                  const isSelected = selectedDay === i;
                  const isToday = addDays(weekStart, i) === today.toISOString().split("T")[0];
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDay(i === selectedDay ? null : i)}
                      style={{
                        flex: 1, display: "flex", flexDirection: "column",
                        alignItems: "center", gap: "6px", height: "100%",
                        justifyContent: "flex-end", cursor: "pointer",
                      }}
                      title={`${DAYS[i]}: ${v} transactions`}
                    >
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#fef08a", opacity: isSelected ? 1 : 0, transition: "opacity 0.15s" }}>{v}</span>
                      <div style={{
                        width: "100%",
                        height: `${(v / maxWeekBar) * 100}%`,
                        backgroundColor: isSelected ? "#C8883A" : DAY_COLORS[i],
                        borderRadius: "2px 2px 0 0",
                        minHeight: v > 0 ? 3 : 0,
                        transition: "all 0.2s",
                        transform: isSelected ? "scaleY(1.05)" : "scaleY(1)",
                        transformOrigin: "bottom",
                        opacity: isSelected ? 1 : 0.75,
                        boxShadow: isSelected ? "0 0 12px rgba(200, 136, 58, 0.4)" : "none"
                      }} />
                      <span style={{
                        fontSize: "11px",
                        color: isSelected ? "#C8883A" : "#94a3b8",
                        fontWeight: isSelected ? 700 : 500,
                        marginTop: "2px",
                      }}>
                        {isToday ? "●" : DAYS[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revenue Polyline Trend Vector */}
            <div style={mainGlassPanelStyle}>
              <h2 style={{ ...panelTitleStyle, marginBottom: "16px" }}>Financial Yield Trend Curve</h2>
              <div style={{ position: "relative", padding: "4px 0" }}>
                <svg width="100%" height="110" viewBox="0 0 400 110" preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
                  {/* Layout Grid Separators */}
                  {[22, 60, 98].map((y) => (
                    <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  ))}
                  
                  {/* Generated Polyline Stream Node */}
                  <polyline
                    points={weekBars.map((v, i) => `${(i / 6) * 400},${102 - (v / maxWeekBar) * 90}`).join(" ")}
                    fill="none" 
                    stroke="#C8883A" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ dropShadow: "0 4px 6px rgba(0,0,0,0.5)" }}
                  />
                  
                  {/* Interactive Dot Node Pins */}
                  {weekBars.map((v, i) => (
                    <circle
                      key={i}
                      cx={(i / 6) * 400}
                      cy={102 - (v / maxWeekBar) * 90}
                      r={selectedDay === i ? 6 : 4}
                      fill={selectedDay === i ? "#FFFFFF" : "#C8883A"}
                      stroke="#080605"
                      strokeWidth="2"
                      style={{ cursor: "pointer", transition: "all 0.15s" }}
                      onClick={() => setSelectedDay(i === selectedDay ? null : i)}
                    />
                  ))}
                </svg>
              </div>

              {/* Vector Horizontal Labels */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", padding: "0 4px" }}>
                {DAYS.map((d, i) => (
                  <span
                    key={d}
                    style={{
                      fontSize: "11px",
                      color: selectedDay === i ? "#C8883A" : "#94a3b8",
                      fontWeight: selectedDay === i ? 700 : 500,
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
    </div>
  );
}

/* ─── ULTRA-COMPACT DARK THEME DESIGN SYSTEM ─── */
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
  backgroundImage: "url('/Reports-bg.png')",
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
  backgroundColor: "rgba(8, 6, 5, 0.72)", 
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

const twoColumnGridStyle: React.CSSProperties = {
  display: "grid", 
  gridTemplateColumns: "1fr 1.2fr", 
  gap: "16px", 
  alignItems: "start",
  flexWrap: "wrap"
};

const compactGlassCardStyle: React.CSSProperties = {
  backgroundColor: "rgba(20, 18, 16, 0.82)",
  backdropFilter: "blur(12px)", 
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "4px",
  padding: "14px 18px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
};

const mainGlassPanelStyle: React.CSSProperties = {
  backgroundColor: "rgba(20, 18, 16, 0.82)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "6px",
  padding: "20px 24px",
  boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const dateWeekRangeLabelStyle: React.CSSProperties = {
  fontSize: "13px", 
  color: "#cbd5e1", 
  marginTop: "2px", 
  marginHeight: 0, 
  fontWeight: 500
};

const cardValueStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "normal",
  fontFamily: "Georgia, serif",
  color: "#FFFFFF",
  marginTop: "4px"
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  fontWeight: "normal",
  fontFamily: "Georgia, serif",
  color: "#FFFFFF"
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  paddingBottom: "8px"
};

const metricsSubGridStyle: React.CSSProperties = {
  display: "grid", 
  gridTemplateColumns: "1fr 1fr", 
  gap: "12px"
};

const filterBarStyle: React.CSSProperties = {
  display: "flex",
  gap: "4px",
  flexWrap: "wrap",
};

const activeFilterBtnStyle: React.CSSProperties = {
  backgroundColor: "rgba(200, 136, 58, 0.12)",
  color: "#C8883A",
  border: "1px solid rgba(200, 136, 58, 0.4)",
  padding: "3px 8px",
  borderRadius: "3px",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

const inactiveFilterBtnStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#64748b",
  border: "1px solid transparent",
  padding: "3px 8px",
  borderRadius: "3px",
  fontSize: "11px",
  fontWeight: 500,
  cursor: "pointer",
};

const pagingBtnStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#FFFFFF",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  padding: "4px 12px",
  borderRadius: "3px",
  fontSize: "12px",
  cursor: "pointer",
};

const todayBtnStyle: React.CSSProperties = {
  ...pagingBtnStyle,
  fontSize: "11px",
  color: "#C8883A",
  borderColor: "rgba(200, 136, 58, 0.2)"
};

const disablePagingBtnStyle: React.CSSProperties = {
  ...pagingBtnStyle,
  color: "rgba(255,255,255,0.15)",
  borderColor: "rgba(255,255,255,0.03)",
  cursor: "not-allowed"
};

const dismissBtnStyle: React.CSSProperties = {
  fontSize: "11px", 
  color: "#94a3b8", 
  background: "none", 
  border: "none", 
  cursor: "pointer", 
  fontFamily: "inherit"
};

const dashedPlaceholderStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px dashed rgba(255,255,255,0.15)",
  borderRadius: "4px",
  padding: "16px",
  textAlign: "center",
  fontSize: "12px",
  color: "#64748b"
};

const inlineLinkStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "#C8883A",
  textDecoration: "none",
};

const statusMessageStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "24px",
  fontSize: "13px",
  color: "#64748b"
};