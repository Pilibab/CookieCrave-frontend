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
  const { data: customers } = useFetch(() => customersApi.list());

  const [customerId, setCustomerId]           = useState<string>("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("Pick_Up");
  const [paymentMethod, setPaymentMethod]     = useState<PaymentMethod>("Cash");
  const [referenceNo, setReferenceNo]         = useState("");
  const [cart, setCart]                       = useState<CartItem[]>([]);
  const [address, setAddress]                 = useState("");
  const [preferredTime, setPreferredTime]     = useState("");
  const [pickUpLocation, setPickUpLocation]   = useState("");
  const [error, setError]                     = useState("");
  const [submitting, setSubmitting]           = useState(false);

  const available = products?.filter((p) => p.prod_available) ?? [];

  const addToCart = (product_id: number) => {
    const p = available.find((p) => p.prod_id === product_id);
    if (!p) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product_id);
      if (existing)
        return prev.map((i) =>
          i.product_id === product_id ? { ...i, quantity: i.quantity + 1 } : i
        );
      return [...prev, { product_id, product_name: p.prod_name, price: p.prod_price, quantity: 1 }];
    });
  };

  const updateQty = (product_id: number, qty: number) => {
    if (qty < 1) { setCart((prev) => prev.filter((i) => i.product_id !== product_id)); return; }
    setCart((prev) => prev.map((i) => (i.product_id === product_id ? { ...i, quantity: qty } : i)));
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
      const flatProdIds: number[] = [];
      cart.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) flatProdIds.push(item.product_id);
      });

      const orderPayload = {
        cust_id: customerId,
        total_amount: total,
        ord_pay_meth: paymentMethod,
        ord_f_type: fulfillmentType,
        prod_ids: flatProdIds,
        ...(paymentMethod === "GCash" ? { reference_no: referenceNo } : {}),
      };

      const response = await ordersApi.create(orderPayload) as any;
      if (response.status === "Failed") throw new Error(response.error || "Backend failed to process order.");
      router.push(`/orders/${response.order_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Background layers — identical to Inventory page */}
      <div style={backgroundWrapperStyle} />
      <div style={luxuryScrimOverlayStyle} />

      <div style={contentWrapperStyle}>
        {/* Page Header */}
        <div style={headerContainerStyle}>
          <div>
            <h1 style={titleStyle}>New Order</h1>
            <p style={subtitleStyle}>
              {cart.length === 0
                ? "Select a customer and add products to begin"
                : `${cart.reduce((s, i) => s + i.quantity, 0)} item${cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""} in cart`}
            </p>
          </div>
        </div>

        {/* Body: two-column layout */}
        <div style={bodyGridStyle}>

          {/* ── Left Column ── */}
          <div style={leftColStyle}>

            {/* Customer Panel */}
            <div style={glassPanelStyle}>
              <div style={panelHeaderStyle}>
                <h2 style={panelTitleStyle}>Customer</h2>
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Select Customer</label>
                <select
                  style={selectStyle}
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="" style={{ background: "#141210", color: "#64748b" }}>— Select —</option>
                  {customers?.map((c) => (
                    <option key={c.cust_id} value={c.cust_id} style={{ background: "#141210", color: "#fff" }}>
                      {c.cust_firstname} {c.cust_lastname} ({c.cust_email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Panel */}
            <div style={glassPanelStyle}>
              <div style={panelHeaderStyle}>
                <h2 style={panelTitleStyle}>Products</h2>
                <span style={subtleBadgeStyle}>{available.length} available</span>
              </div>
              <div style={productGridStyle}>
                {available.map((p) => {
                  const inCart = cart.find((i) => i.product_id === p.prod_id);
                  return (
                    <div
                      key={p.prod_id}
                      style={{
                        ...productCardStyle,
                        border: inCart
                          ? "1.5px solid rgba(200,136,58,0.6)"
                          : "1px solid rgba(255,255,255,0.06)",
                        backgroundColor: inCart
                          ? "rgba(200,136,58,0.07)"
                          : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <p style={productNameStyle}>{p.prod_name}</p>
                      <p style={productPriceStyle}>₱{Number(p.prod_price).toFixed(2)}</p>
                      {inCart ? (
                        <div style={qtyRowStyle}>
                          <button style={qtyBtnStyle} onClick={() => updateQty(p.prod_id, inCart.quantity - 1)}>−</button>
                          <span style={qtyNumStyle}>{inCart.quantity}</span>
                          <button style={qtyBtnStyle} onClick={() => updateQty(p.prod_id, inCart.quantity + 1)}>+</button>
                        </div>
                      ) : (
                        <button style={addBtnStyle} onClick={() => addToCart(p.prod_id)}>Add</button>
                      )}
                    </div>
                  );
                })}
                {available.length === 0 && (
                  <p style={{ color: "#64748b", fontSize: "13px", fontStyle: "italic" }}>
                    No products available.
                  </p>
                )}
              </div>
            </div>

            {/* Fulfillment Panel */}
            <div style={glassPanelStyle}>
              <div style={panelHeaderStyle}>
                <h2 style={panelTitleStyle}>Fulfillment</h2>
              </div>

              <div style={segmentRowStyle}>
                {(["Pick_Up", "Delivery"] as FulfillmentType[]).map((t) => (
                  <button
                    key={t}
                    style={fulfillmentType === t ? activeSegmentBtnStyle : inactiveSegmentBtnStyle}
                    onClick={() => setFulfillmentType(t)}
                  >
                    {t === "Pick_Up" ? "Pick Up" : "Delivery"}
                  </button>
                ))}
              </div>

              {fulfillmentType === "Delivery" && (
                <div style={{ ...fieldGroupStyle, marginTop: 16 }}>
                  <label style={labelStyle}>Delivery Address *</label>
                  <input
                    style={inputStyle}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full delivery address..."
                  />
                </div>
              )}

              {fulfillmentType === "Pick_Up" && (
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <div style={{ ...fieldGroupStyle, flex: 1 }}>
                    <label style={labelStyle}>Preferred Time</label>
                    <input
                      style={inputStyle}
                      type="time"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                    />
                  </div>
                  <div style={{ ...fieldGroupStyle, flex: 1 }}>
                    <label style={labelStyle}>Pick-up Location</label>
                    <input
                      style={inputStyle}
                      value={pickUpLocation}
                      onChange={(e) => setPickUpLocation(e.target.value)}
                      placeholder="e.g. Legazpi City"
                    />
                  </div>
                </div>
              )}

              <div style={{ ...fieldGroupStyle, marginTop: 16 }}>
                <label style={labelStyle}>Payment Method</label>
                <select
                  style={selectStyle}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  <option value="Cash" style={{ background: "#141210", color: "#fff" }}>Cash</option>
                  <option value="GCash" style={{ background: "#141210", color: "#fff" }}>GCash</option>
                </select>
              </div>

              {paymentMethod === "GCash" && (
                <div style={{ ...fieldGroupStyle, marginTop: 16 }}>
                  <label style={labelStyle}>GCash Reference Number *</label>
                  <input
                    style={inputStyle}
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="Enter 13-digit reference number"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Order Summary ── */}
          <div style={rightColStyle}>
            <div style={{ ...glassPanelStyle, position: "sticky", top: 20 }}>
              <div style={panelHeaderStyle}>
                <h2 style={panelTitleStyle}>Order Summary</h2>
              </div>

              {cart.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13px", fontStyle: "italic", padding: "8px 0" }}>
                  No items added yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {cart.map((item) => (
                    <div key={item.product_id} style={summaryRowStyle}>
                      <div>
                        <p style={summaryItemNameStyle}>{item.product_name}</p>
                        <p style={summaryItemQtyStyle}>× {item.quantity}</p>
                      </div>
                      <span style={summaryItemPriceStyle}>
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div style={dividerStyle} />

              <div style={totalRowStyle}>
                <span style={totalLabelStyle}>Total</span>
                <span style={totalAmountStyle}>
                  ₱{total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {error && (
                <div style={errorBoxStyle}>
                  <span style={{ fontSize: 12 }}>⚠ {error}</span>
                </div>
              )}

              <button
                style={{
                  ...placeOrderBtnStyle,
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Placing Order…" : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles — matching Inventory page dark luxury bakery aesthetic ─────────────

const containerStyle: React.CSSProperties = {
  position: "relative",
  minHeight: "calc(100vh - var(--navbar-h, 60px))",
  overflowY: "auto",
  padding: "24px 32px",
  backgroundColor: "#080605",
  fontFamily: "system-ui, -apple-system, sans-serif",
  color: "#FFFFFF",
};

const backgroundWrapperStyle: React.CSSProperties = {
  position: "fixed",
  top: "var(--navbar-h, 60px)",
  left: 0, right: 0, bottom: 0,
  backgroundImage: "url('/Inventory-bg.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  opacity: 1.0,
  zIndex: 0,
  pointerEvents: "none",
};

const luxuryScrimOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: "var(--navbar-h, 60px)",
  left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(8, 6, 5, 0.7)",
  zIndex: 1,
  pointerEvents: "none",
};

const contentWrapperStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  maxWidth: "1340px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
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

const bodyGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 320px",
  gap: "20px",
  alignItems: "start",
};

const leftColStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const rightColStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const glassPanelStyle: React.CSSProperties = {
  backgroundColor: "rgba(20,18,16,0.82)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: "6px",
  padding: "20px 24px",
  boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  paddingBottom: "12px",
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "16px",
  fontWeight: "normal",
  fontFamily: "Georgia, serif",
  color: "#FFFFFF",
};

const subtleBadgeStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const fieldGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: "4px",
  border: "1px solid rgba(255,255,255,0.1)",
  backgroundColor: "rgba(8,6,5,0.8)",
  fontSize: "13px",
  color: "#FFFFFF",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const productGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "10px",
};

const productCardStyle: React.CSSProperties = {
  borderRadius: "6px",
  padding: "14px",
  transition: "border-color 0.2s, background-color 0.2s",
};

const productNameStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: "13px",
  color: "#FFFFFF",
  margin: "0 0 4px 0",
};

const productPriceStyle: React.CSSProperties = {
  color: "#C8883A",
  fontWeight: 700,
  fontSize: "14px",
  margin: "0 0 10px 0",
};

const qtyRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const qtyBtnStyle: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "3px",
  padding: "4px 10px",
  fontSize: "14px",
  cursor: "pointer",
  lineHeight: 1,
};

const qtyNumStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: "14px",
  color: "#FFFFFF",
  minWidth: "20px",
  textAlign: "center",
};

const addBtnStyle: React.CSSProperties = {
  backgroundColor: "#C8883A",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "3px",
  padding: "5px 14px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(200,136,58,0.15)",
};

const segmentRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "4px",
};

const activeSegmentBtnStyle: React.CSSProperties = {
  backgroundColor: "rgba(200,136,58,0.12)",
  color: "#C8883A",
  border: "1px solid rgba(200,136,58,0.4)",
  padding: "6px 16px",
  borderRadius: "3px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const inactiveSegmentBtnStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#64748b",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "6px 16px",
  borderRadius: "3px",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "8px 0",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
};

const summaryItemNameStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  fontWeight: 600,
  color: "#C8883A",
};

const summaryItemQtyStyle: React.CSSProperties = {
  margin: "2px 0 0 0",
  fontSize: "11px",
  color: "#64748b",
};

const summaryItemPriceStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#FFFFFF",
  whiteSpace: "nowrap",
};

const dividerStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  margin: "14px 0",
};

const totalRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const totalLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const totalAmountStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  fontFamily: "Georgia, serif",
  color: "#FFFFFF",
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: "12px",
  backgroundColor: "rgba(254,226,226,0.08)",
  border: "1px solid rgba(252,165,165,0.25)",
  borderRadius: "4px",
  padding: "10px 12px",
  color: "#fca5a5",
};

const placeOrderBtnStyle: React.CSSProperties = {
  marginTop: "16px",
  width: "100%",
  backgroundColor: "#C8883A",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "4px",
  padding: "12px",
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "0.3px",
  boxShadow: "0 4px 16px rgba(200,136,58,0.25)",
  fontFamily: "Georgia, serif",
};
