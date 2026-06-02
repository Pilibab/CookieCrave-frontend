"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { productsApi, customersApi, ordersApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import type { FulfillmentType, PaymentMethod } from "@/types/mytypes";

interface CartItem { 
  product_id: number; 
  product_name: string; 
  price: number; 
  quantity: number; 
}

export default function NewOrderPage() {
  const router = useRouter();

  const { data: products } = useFetch(productsApi.list);
  const { data: customers } = useFetch(() => customersApi.list(1, 100));

  const [customerId, setCustomerId] = useState<string>(""); // Kept as string to safely handle DB UUIDs
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("Pick_Up");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [referenceNo, setReferenceNo] = useState(""); // ADDED: State for GCash verification
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [pickUpLocation, setPickUpLocation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const available = products?.filter((p) => p.prod_available) ?? [];

  const addToCart = (product_id: number) => {
    const p = available.find((p) => p.prod_id === product_id);
    if (!p) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product_id);
      if (existing) return prev.map((i) => i.product_id === product_id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product_id, product_name: p.prod_name, price: p.prod_price, quantity: 1 }];
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
    if (paymentMethod === "GCash" && !referenceNo.trim()) { setError("Please enter the GCash Reference Number."); return; }

    setSubmitting(true);
    try {
      // FIX: Transform array of objects with quantities into a flat array of IDs matching backend expectations
      const flatProdIds: number[] = [];
      cart.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          flatProdIds.push(item.product_id);
        }
      });

      // FIX: Payload completely reconstructed to match 'CreateOrderBody' and the Python Dictionary schema
      const orderPayload = {
        cust_id: customerId,
        total_amount: total,
        ord_pay_meth: paymentMethod,
        ord_f_type: fulfillmentType,
        prod_ids: flatProdIds,
        ...(paymentMethod === "GCash" ? { reference_no: referenceNo } : {}),
      };

      // FIX: Combined action execution. Fulfillment creation is implicitly handled downstream by backend service
      const response = await ordersApi.create(orderPayload) as any;

      if (response.status === "Failed") {
        throw new Error(response.error || "Backend failed to process order context.");
      }

      router.push(`/orders/${response.order_id}`);
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
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">— Select —</option>
                {customers?.data.map((c) => (
                  <option key={c.cust_id} value={c.cust_id}>
                    {c.cust_firstname} {c.cust_lastname} ({c.cust_email})
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
                const inCart = cart.find((i) => i.product_id === p.prod_id);
                return (
                  <div
                    key={p.prod_id}
                    style={{
                      border: inCart ? "2px solid #0d1240" : "1.5px solid #e2ddd6",
                      borderRadius: 10, padding: 14,
                    }}
                  >
                    {/* FIX: Field corrected to match Database DB schemas (prod_name) */}
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{p.prod_name}</p>
                    {/* FIX: Field corrected to match Database DB schemas (prod_price) */}
                    <p style={{ color: "#c8883a", fontWeight: 700, margin: "4px 0 10px" }}>₱{Number(p.prod_price).toFixed(2)}</p>
                    {inCart ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button className="btn btn-secondary" style={{ padding: "4px 10px" }} onClick={() => updateQty(p.prod_id, inCart.quantity - 1)}>−</button>
                        <span style={{ fontWeight: 600 }}>{inCart.quantity}</span>
                        <button className="btn btn-secondary" style={{ padding: "4px 10px" }} onClick={() => updateQty(p.prod_id, inCart.quantity + 1)}>+</button>
                      </div>
                    ) : (
                      <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => addToCart(p.prod_id)}>Add</button>
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

            {/* ADDED: Context-aware rendering wrapper for Reference String inputs required by your Python service block */}
            {paymentMethod === "GCash" && (
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">GCash Reference Number *</label>
                <input 
                  className="form-input" 
                  value={referenceNo} 
                  onChange={(e) => setReferenceNo(e.target.value)} 
                  placeholder="Enter 13-digit reference number" 
                />
              </div>
            )}
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