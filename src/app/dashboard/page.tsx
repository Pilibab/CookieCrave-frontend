"use client";

import { useFetch } from "@/hooks/useFetch";
import { ordersApi, reportsApi, inventoryApi } from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const { data: summary, loading: sumLoading } = useFetch(reportsApi.weeklySummary);
  const { data: orders, loading: ordersLoading } = useFetch(() =>
    ordersApi.list(1, 5, "Pending")
  );
  const { data: lowStock } = useFetch(inventoryApi.lowStock);

  // Check if ordering window is open (Mon–Fri before 10PM)
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const hour = now.getHours();
  const isOrderingOpen = day >= 1 && day <= 5 && hour < 22;

  return (
    <div className="page-body">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            background: isOrderingOpen ? "#d4edda" : "#f8d7da",
            color: isOrderingOpen ? "#155724" : "#721c24",
          }}
        >
          <span
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: isOrderingOpen ? "#27ae60" : "#c0392b",
              display: "inline-block",
            }}
          />
          Orders {isOrderingOpen ? "Open" : "Closed"}
        </span>
      </div>

      {/* ── Summary cards ── */}
      <div style={s.grid4}>
        <MetricCard
          label="Total Orders (Week)"
          value={sumLoading ? "—" : String(summary?.total_orders ?? 0)}
          sub="This week"
          color="#0d1240"
        />
        <MetricCard
          label="Completed"
          value={sumLoading ? "—" : String(summary?.completed_orders ?? 0)}
          sub="Fulfilled orders"
          color="#27ae60"
        />
        <MetricCard
          label="Weekly Revenue"
          value={sumLoading ? "—" : `₱${(summary?.total_revenue ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          sub="Gross sales"
          color="#c8883a"
        />
        <MetricCard
          label="Low Stock Items"
          value={String(lowStock?.length ?? 0)}
          sub="Need restocking"
          color={lowStock && lowStock.length > 0 ? "#c0392b" : "#27ae60"}
        />
      </div>

      {/* ── Pending orders + low stock side by side ── */}
      <div style={s.grid2}>
        {/* Pending orders */}
        <div className="card">
          <div style={s.cardHeader}>
            <h3 style={{ fontSize: 16 }}>Pending Orders</h3>
            <Link href="/orders?status=Pending" style={s.viewAll}>View all →</Link>
          </div>
          {ordersLoading ? (
            <div className="spinner" />
          ) : orders?.data.length === 0 ? (
            <p style={{ color: "#6b6f8a", fontSize: 14, padding: "16px 0" }}>No pending orders</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.data.map((order) => (
                    <tr key={order.order_id}>
                      <td>
                        <Link href={`/orders/${order.order_id}`} style={{ color: "#0d1240", fontWeight: 600 }}>
                          #{order.order_id}
                        </Link>
                      </td>
                      <td>{order.customer?.given_name} {order.customer?.last_name}</td>
                      <td>₱{Number(order.total_amount).toFixed(2)}</td>
                      <td style={{ fontSize: 12, color: "#6b6f8a" }}>
                        {new Date(order.order_time).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="card">
          <div style={s.cardHeader}>
            <h3 style={{ fontSize: 16 }}>Low Stock Alerts</h3>
            <Link href="/inventory" style={s.viewAll}>View all →</Link>
          </div>
          {!lowStock || lowStock.length === 0 ? (
            <p style={{ color: "#27ae60", fontSize: 14, padding: "16px 0" }}>✓ All stock levels OK</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Stock</th>
                    <th>Unit</th>
                    <th>Reorder At</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item) => (
                    <tr key={item.inventory_id}>
                      <td style={{ fontWeight: 500 }}>{item.ingredients_name}</td>
                      <td style={{ color: "#c0392b", fontWeight: 600 }}>{item.current_stock}</td>
                      <td>{item.unit_of_measure}</td>
                      <td style={{ color: "#6b6f8a" }}>{item.recorder_trigger}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, sub, color,
}: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#6b6f8a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 700, color, margin: "6px 0 2px", fontFamily: "'DM Serif Display', serif" }}>
        {value}
      </p>
      <p style={{ fontSize: 12, color: "#6b6f8a" }}>{sub}</p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: 16,
  },
  cardHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 12,
  },
  viewAll: { fontSize: 13, color: "#c8883a", fontWeight: 600 },
};
