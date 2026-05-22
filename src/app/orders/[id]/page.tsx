"use client";

import { useFetch, useMutation } from "@/hooks/useFetch";
import { ordersApi } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { OrderStatus } from "@/types";

const STATUS_FLOW: OrderStatus[] = [
  "Pending", "Confirmed", "Baking", "Out for Delivery", "For Pickup", "Completed",
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);

  const { data: order, loading, error, refetch } = useFetch(
    () => ordersApi.get(orderId),
    [orderId]
  );

  const { mutate: updateStatus, loading: updating } = useMutation(
    (status: OrderStatus) => ordersApi.updateStatus(orderId, status)
  );

  const handleStatusChange = async (status: OrderStatus) => {
    await updateStatus(status);
    refetch();
  };

  if (loading) return <div className="page-body"><div className="spinner" /></div>;
  if (error || !order) return <div className="page-body"><p style={{ color: "red" }}>Order not found.</p></div>;

  const currentIdx = STATUS_FLOW.indexOf(order.order_status as OrderStatus);

  return (
    <div className="page-body">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/orders" style={{ color: "#6b6f8a", fontSize: 14 }}>← Orders</Link>
          <h1 className="page-title">Order #{order.order_id}</h1>
        </div>
        <span style={{ fontSize: 13, color: "#6b6f8a" }}>
          Invoice: {order.invoice ? `#${order.invoice.invoice_id}` : "Pending"}
        </span>
      </div>

      {/* Status stepper */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>Order Status</h3>
        <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
          {STATUS_FLOW.map((status, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={status} style={{ display: "flex", alignItems: "center" }}>
                <button
                  onClick={() => handleStatusChange(status)}
                  disabled={updating}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    background: done ? "#d4edda" : active ? "#0d1240" : "#f0f0f0",
                    color: done ? "#155724" : active ? "#fff" : "#6b6f8a",
                    transition: "all 0.15s",
                  }}
                >
                  {done ? "✓ " : ""}{status}
                </button>
                {i < STATUS_FLOW.length - 1 && (
                  <span style={{ color: "#ccc", margin: "0 4px" }}>›</span>
                )}
              </div>
            );
          })}
          {order.order_status !== "Cancelled" && (
            <button
              onClick={() => handleStatusChange("Cancelled")}
              disabled={updating}
              className="btn btn-danger"
              style={{ marginLeft: "auto", fontSize: 13 }}
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Customer info */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Customer</h3>
          {order.customer ? (
            <dl style={dl}>
              <dt>Name</dt>
              <dd>{order.customer.given_name} {order.customer.middle_name ?? ""} {order.customer.last_name} {order.customer.suffix ?? ""}</dd>
              <dt>Email</dt>
              <dd>{order.customer.email}</dd>
              <dt>Contact</dt>
              <dd>{order.customer.contact_num ?? "—"}</dd>
            </dl>
          ) : <p style={{ color: "#6b6f8a" }}>Customer #{order.customer_id}</p>}
        </div>

        {/* Fulfillment info */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Fulfillment</h3>
          <dl style={dl}>
            <dt>Type</dt>
            <dd>{order.fulfillment?.fulfillment_type ?? "—"}</dd>
            {order.fulfillment?.fulfillment_type === "Delivery" && order.fulfillment.delivery && (
              <>
                <dt>Address</dt>
                <dd>{order.fulfillment.delivery.address}</dd>
                {order.fulfillment.delivery.floor_unit_num && (
                  <><dt>Unit/Floor</dt><dd>{order.fulfillment.delivery.floor_unit_num}</dd></>
                )}
                {order.fulfillment.delivery.note && (
                  <><dt>Note</dt><dd>{order.fulfillment.delivery.note}</dd></>
                )}
              </>
            )}
            {order.fulfillment?.fulfillment_type === "Pick_Up" && order.fulfillment.pick_up && (
              <>
                <dt>Preferred Time</dt>
                <dd>{order.fulfillment.pick_up.preferred_time ?? "—"}</dd>
                <dt>Pick-up Location</dt>
                <dd>{order.fulfillment.pick_up.pick_up_location ?? "—"}</dd>
              </>
            )}
            <dt>Payment</dt>
            <dd>{order.payment_method}</dd>
            <dt>Total</dt>
            <dd style={{ fontWeight: 700, fontSize: 16 }}>
              ₱{Number(order.total_amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </dd>
          </dl>
        </div>
      </div>

      {/* Order items */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Ordered Items</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price/Item</th>
                <th>Qty</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(order.cart_items ?? []).map((item) => (
                <tr key={item.product_id}>
                  <td>{item.product?.product_name ?? `Product #${item.product_id}`}</td>
                  <td>₱{Number(item.price_per_item).toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td style={{ fontWeight: 600 }}>
                    ₱{(item.price_per_item * item.quantity).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={{ textAlign: "right", fontWeight: 700 }}>Total</td>
                <td style={{ fontWeight: 700, fontSize: 16 }}>
                  ₱{Number(order.total_amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const dl: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "120px 1fr",
  gap: "6px 12px",
  fontSize: 14,
};
