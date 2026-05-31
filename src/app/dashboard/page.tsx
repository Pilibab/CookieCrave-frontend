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

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ─── BACKGROUND IMAGE ─────────────────────────── */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-amber-700 bg-[url('/dashboard-bg.png')]" />

      {/* Right half: logo */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-center pointer-events-none z-10">
        <img
          src="/CKWebLogo.png"
          alt="CookieKrave"
          className="w-70 max-w-xs object-contain"
        />
      </div>

      {/* ── Left content panel — full height, with left spacing ── */}
      <div className="relative z-20 w-1/2 px-7 pb-8 pl-7 flex flex-col gap-4 min-h-screen">

        {/* Row 1: Dashboard pill + Total Orders pill */}
        <div className="flex items-end gap-3">
          {/* Dashboard pill — no left margin, butts the page edge just like navbar */}
          <div className="bg-blue-950 rounded-b-3xl px-7 py-5 text-white font-black text-2xl -tracking-tight box-shadow-lg leading-tight flex-shrink-0">
            Dashboard
          </div>

          {/* Total Orders pill — elongated, matches screenshot style */}
          <div className="bg-white bg-opacity-93 backdrop-blur rounded-full px-7 py-3 flex items-center gap-3 box-shadow-lg">
            <span className="text-xl font-bold text-blue-950">
              {sumLoading ? "—" : summary?.total_orders ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-bold whitespace-nowrap">
              Total Orders this week
            </span>
          </div>
        </div>

        {/* Row 2: Three metric cards — left-aligned with consistent margin */}
        <div className="grid grid-cols-3 gap-3 ml-5">
          <div className="bg-white bg-opacity-93 backdrop-blur rounded-2xl p-5 box-shadow-lg">
            <div className="text-3xl font-bold text-blue-950 leading-tight">{sumLoading ? "—" : summary?.completed_orders ?? 0}</div>
            <div className="text-xs text-slate-500 font-bold mt-2">Fulfilled Orders</div>
            <Link href="/orders?status=Completed">
              <button className="view-btn mt-3">View</button>
            </Link>
          </div>

          <div className="bg-white bg-opacity-93 backdrop-blur rounded-2xl p-5 box-shadow-lg">
            <div className="text-lg font-bold text-blue-950 leading-tight">
              {sumLoading ? "—" : `₱${Number(summary?.total_revenue ?? 0).toLocaleString("en-PH")}`}
            </div>
            <div className="text-xs text-slate-500 font-bold mt-2">Weekly Revenue</div>
            <Link href="/reports">
              <button className="view-btn mt-3 bg-transparent text-blue-950 border-2 border-slate-300">View</button>
            </Link>
          </div>

          <div className="bg-white bg-opacity-93 backdrop-blur rounded-2xl p-5 box-shadow-lg">
            <div className={`text-3xl font-bold leading-tight ${lowStock && lowStock.length > 0 ? "text-red-700" : "text-blue-950"}`}>
              {lowStock?.length ?? 0}
            </div>
            <div className="text-xs text-slate-500 font-bold mt-2">Low Stock Items</div>
            <Link href="/inventory">
              <button className="view-btn mt-3">View</button>
            </Link>
          </div>
        </div>

        {/* Row 3: Pending Orders card */}
        <div className="bg-white bg-opacity-93 backdrop-blur rounded-2xl p-5 box-shadow-lg ml-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">Pending Orders</h3>
            <Link href="/orders?status=Pending" className="text-xs text-slate-500 font-bold">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-0 px-1 pb-2 border-b border-slate-300 text-xs text-slate-500 font-bold">
            <span>Order ID</span>
            <span>Customer</span>
            <span>Amount</span>
            <span>Time</span>
          </div>

          {ordersLoading ? (
            <div className="spinner" />
          ) : !orders?.data.length ? (
            <p className="text-slate-500 text-sm py-2.5">No pending orders</p>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {orders.data.slice(0, 3).map((order) => (
                <Link key={order.order_id} href={`/orders/${order.order_id}`}>
                  <div className="bg-blue-950 rounded-lg p-2.5 grid grid-cols-4 text-white text-xs font-medium cursor-pointer">
                    <span>#{order.order_id}</span>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {order.customer?.given_name} {order.customer?.last_name}
                    </span>
                    <span>₱{Number(order.total_amount).toFixed(2)}</span>
                    <span className="text-xs opacity-80">
                      {new Date(order.order_time).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}