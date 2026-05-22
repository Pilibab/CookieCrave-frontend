"use client";

import { useState } from "react";
import { useFetch, useMutation } from "@/hooks/useFetch";
import { productsApi, customersApi, fulfillmentApi, ordersApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import type { FulfillmentType, PaymentMethod } from "@/types";

interface CartItem { product_id: number; product_name: string; price: number; quantity: number; }

export default function NewOrderPage() {
  const router = useRouter();

  const { data: products } = useFetch(productsApi.list);
  const { data: customers } = useFetch(() => customersApi.list(1, 100));

  const [customerId, setCustomerId] = useState<number | "">("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("Pick_Up");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [pickUpLocation, setPickUpLocation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const available = products?.filter((p) => p.is_available) ?? [];

  const addToCart = (product_id: number) => {
    const p = available.find((p) => p.product_id === product_id);
    if (!p) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product_id);
      if (existing) return prev.map((i) => i.product_id === product_id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product_id, product_name: p.product_name, price: p.price, quantity: 1 }];
    });
  };

  const updateQty = (product_id: number, qty: number) => {
    if (qty < 1) { setCart((prev) => prev.filter((i) => i.product_id !== product_id)); return; }
    setCart((prev) => prev.map((i) => i.product_id === product_id ? { ...i, quantity: qty } : i));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSubmit = async () => {
    setError("");
    if (!customerId) { setError("Please select a customer."); return; }
    if (cart.length === 0) { setError("Please add at least one product."); return; }
    if (fulfillmentType === "Delivery" && !address) { setError("Please enter a delivery address."); return; }

    setSubmitting(true);
    try {
      // 1. Create fulfillment
      const fulfillment = await fulfillmentApi.create({
        fulfillment_type: fulfillmentType,
        ...(fulfillmentType === "Delivery"
          ? { delivery: { address, fulfillment_id: 0 } }
          : { pick_up: { preferred_time: preferredTime, pick_up_location: pickUpLocation, fulfillment_id: 0 } }),
      });

      // 2. Create order
      const order = await ordersApi.create({
        customer_id: customerId as number,
        fulfillment_id: fulfillment.fulfillment_id,
        payment_method: paymentMethod,
        cart_items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });

      router.push(`/orders/${order.order_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <h1 className="page-title">New Order</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* Left col */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Customer */}
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Customer</h3>
            <div className="form-group">
              <label className="form-label">Select Customer</label>
              <select
                className="form-select"
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value))}
              >
                <option value="">— Select —</option>
                {customers?.data.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.given_name} {c.last_name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products */}
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Products</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {available.map((p) => {
                const inCart = cart.find((i) => i.product_id === p.product_id);
                return (
                  <div
                    key={p.product_id}
                    style={{
                      border: inCart ? "2px solid #0d1240" : "1.5px solid #e2ddd6",
                      borderRadius: 10, padding: 14,
                    }}
                  >
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{p.product_name}</p>
                    <p style={{ color: "#c8883a", fontWeight: 700, margin: "4px 0 10px" }}>₱{Number(p.price).toFixed(2)}</p>
                    {inCart ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button className="btn btn-secondary" style={{ padding: "4px 10px" }} onClick={() => updateQty(p.product_id, inCart.quantity - 1)}>−</button>
                        <span style={{ fontWeight: 600 }}>{inCart.quantity}</span>
                        <button className="btn btn-secondary" style={{ padding: "4px 10px" }} onClick={() => updateQty(p.product_id, inCart.quantity + 1)}>+</button>
                      </div>
                    ) : (
                      <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => addToCart(p.product_id)}>Add</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fulfillment */}
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Fulfillment</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {(["Pick_Up", "Delivery"] as FulfillmentType[]).map((t) => (
                <button
                  key={t}
                  className={`btn ${fulfillmentType === t ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFulfillmentType(t)}
                >
                  {t === "Pick_Up" ? "Pick Up" : "Delivery"}
                </button>
              ))}
            </div>

            {fulfillmentType === "Delivery" && (
              <div className="form-group">
                <label className="form-label">Delivery Address *</label>
                <input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address..." />
              </div>
            )}

            {fulfillmentType === "Pick_Up" && (
              <div style={{ display: "flex", gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Preferred Time</label>
                  <input className="form-input" type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Pick-up Location</label>
                  <input className="form-input" value={pickUpLocation} onChange={(e) => setPickUpLocation(e.target.value)} placeholder="e.g. Legazpi City" />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                <option value="Cash">Cash</option>
                <option value="GCash">GCash</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Order summary */}
        <div>
          <div className="card" style={{ position: "sticky", top: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Order Summary</h3>
            {cart.length === 0 ? (
              <p style={{ color: "#6b6f8a", fontSize: 14 }}>No items added yet.</p>
            ) : (
              cart.map((item) => (
                <div key={item.product_id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                  <span>{item.product_name} × {item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))
            )}
            <hr style={{ border: "none", borderTop: "1.5px solid #e2ddd6", margin: "14px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18 }}>
              <span>Total</span>
              <span>₱{total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
            </div>

            {error && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 12 }}>{error}</p>}

            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 16, justifyContent: "center" }}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Placing Order…" : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
