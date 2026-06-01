"use client";

import React, { useState } from "react";
import CustomerNavbar from "../../../components/home-customer/CustomerNavbar";

const flavors = [
  { id: 1, name: "Mango Macadamia Cookie", badge: "May's Krave", monthly: true, price: 120, emoji: "🥭" },
  { id: 2, name: "Strawberry Creamcheese Cookie", monthly: false, price: 100, emoji: "🍓" },
  { id: 3, name: "Red Velvet Creamcheese Cookie", monthly: false, price: 100, emoji: "❤️" },
  { id: 4, name: "Matcha White Choco Cookie", monthly: false, price: 100, emoji: "🍵" },
  { id: 5, name: "Lemon Crinkle Cookie", monthly: false, price: 100, emoji: "🍋" },
];

type CartItem = { id: number; name: string; price: number; quantity: number; emoji: string };

export default function OrderPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submissionState, setSubmissionState] = useState({ submitted: false, orderId: "" });

  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [fulfillment, setFulfillment] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [address, setAddress] = useState("");
  const addToCart = (flavor: typeof flavors[0]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === flavor.id);
      if (existing) return prev.map((i) => i.id === flavor.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: flavor.id, name: flavor.name, price: flavor.price, quantity: 1, emoji: flavor.emoji }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing && existing.quantity > 1) return prev.map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter((i) => i.id !== id);
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = () => {
  if (cart.length === 0) {
    alert("Please add at least one cookie.");
    return;
  }

  if (!customerName.trim()) {
    alert("Please enter your name.");
    return;
  }

  if (!contactNumber.trim()) {
    alert("Please enter your contact number.");
    return;
  }

  if (fulfillment === "delivery" && !address.trim()) {
    alert("Please enter your delivery address.");
    return;
  }

  const newOrderId = `CK-${Date.now()}`;

  localStorage.setItem("latestOrderId", newOrderId);

  setSubmissionState({
    submitted: true,
    orderId: newOrderId,
  });
};

  if (submissionState.submitted) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fdf8f2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e2ddd6", borderRadius: "16px", padding: "60px 48px", textAlign: "center", maxWidth: "480px" }}>
          <div style={{ fontSize: "64px", marginBottom: "24px" }}>🍪</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "32px", color: "#0d1240", marginBottom: "12px" }}>
            Order Placed!
          </h2>
          <p style={{ color: "#6b6f8a", fontSize: "14px", lineHeight: 1.7, marginBottom: "16px" }}>
            Your order has been placed successfully.
          </p>
          <p style={{ color: "#6b6f8a", fontSize: "13px", marginBottom: "32px" }}>
            Order ID: <strong>{submissionState.orderId}</strong>
          </p>
          <a href="/home-customer" style={{ textDecoration: "none" }}>
            <button style={{ background: "#0d1240", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 28px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
              Back to Home
            </button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fdf8f2", minHeight: "100vh", color: "#0d1240" }}>

      <CustomerNavbar />

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px" }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", color: "#0d1240", marginBottom: "20px" }}>
              Choose Your Cookies
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {flavors.map((flavor) => (
                <div key={flavor.id} style={{ background: "#ffffff", border: "1px solid #e2ddd6", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "10px", flexShrink: 0, background: flavor.monthly ? "linear-gradient(135deg, #0d1240, #2d3580)" : "linear-gradient(135deg, #f0c07a, #c8883a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>
                      {flavor.emoji}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 600, fontSize: "15px", color: "#0d1240" }}>{flavor.name}</span>
                        {flavor.monthly && (
                          <span style={{ background: "#fde8d8", color: "#7d3200", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", letterSpacing: "0.5px" }}>
                            {flavor.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "13px", color: "#6b6f8a", marginTop: "4px" }}>₱{flavor.price} per cookie</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      onClick={() => removeFromCart(flavor.id)}
                      disabled={cart.find((i) => i.id === flavor.id)?.quantity === 0}
                      style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1.5px solid #e2ddd6", background: "#fff", fontSize: "18px", cursor: cart.find((i) => i.id === flavor.id)?.quantity === 0 ? "not-allowed" : "pointer", color: "#0d1240", opacity: cart.find((i) => i.id === flavor.id)?.quantity === 0 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      −
                    </button>
                    <span style={{ fontSize: "16px", fontWeight: 600, minWidth: "20px", textAlign: "center" }}>
                      {cart.find((i) => i.id === flavor.id)?.quantity ?? 0}
                    </span>
                    <button
                      onClick={() => addToCart(flavor)}
                      style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", background: "#0d1240", fontSize: "18px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

            <aside style={{ position: "sticky", top: "80px" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2ddd6", borderRadius: "12px", padding: "24px" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px", color: "#0d1240", marginBottom: "16px" }}>
                Order Summary
              </h3>
              {cart.length === 0 ? (
                <p style={{ color: "#6b6f8a", fontSize: "14px", marginBottom: "16px" }}>No items in your cart yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                      <span>{item.name} × {item.quantity}</span>
                      <span>₱{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
              <hr
  style={{
    border: "none",
    borderTop: "1px solid #e2ddd6",
    margin: "20px 0",
  }}
/>

<h4
  style={{
    marginBottom: "12px",
    color: "#0d1240",
  }}
>
  Customer Details
</h4>

<input
  type="text"
  placeholder="Full Name"
  value={customerName}
  onChange={(e) => setCustomerName(e.target.value)}
  style={{
    width: "100%",
    padding: "12px",
    border: "1px solid #e2ddd6",
    borderRadius: "8px",
    marginBottom: "12px",
    boxSizing: "border-box",
  }}
/>

<input
  type="text"
  placeholder="Contact Number"
  value={contactNumber}
  onChange={(e) => setContactNumber(e.target.value)}
  style={{
    width: "100%",
    padding: "12px",
    border: "1px solid #e2ddd6",
    borderRadius: "8px",
    marginBottom: "12px",
    boxSizing: "border-box",
  }}
/>

<select
  value={fulfillment}
  onChange={(e) => {
    const value = e.target.value;
    setFulfillment(value);

    if (value === "delivery") {
      setPaymentMethod("gcash");
    }
  }}
  style={{
    width: "100%",
    padding: "12px",
    border: "1px solid #e2ddd6",
    borderRadius: "8px",
    marginBottom: "12px",
  }}
>
  <option value="pickup">Pickup</option>
  <option value="delivery">Delivery</option>
</select>

{fulfillment === "delivery" && (
  <>
    <textarea
      placeholder="Delivery Address"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      style={{
        width: "100%",
        padding: "12px",
        border: "1px solid #e2ddd6",
        borderRadius: "8px",
        marginBottom: "12px",
        boxSizing: "border-box",
      }}
    />

    <div
      style={{
        background: "#fde8d8",
        color: "#7d3200",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "12px",
        lineHeight: 1.5,
        marginBottom: "12px",
      }}
    >
      Delivery fee is not included in the cookie total.
      Delivery will be booked through GrabExpress and the fee
      depends on your location. We will contact you using the
      provided phone number to confirm the exact delivery fee.
    </div>
  </>
)}

<select
  value={paymentMethod}
  onChange={(e) => setPaymentMethod(e.target.value)}
  style={{
    width: "100%",
    padding: "12px",
    border: "1px solid #e2ddd6",
    borderRadius: "8px",
    marginBottom: "20px",
  }}
>
  {fulfillment === "pickup" ? (
    <>
      <option value="cash">Cash</option>
      <option value="gcash">GCash</option>
    </>
  ) : (
    <option value="gcash">GCash</option>
  )}
</select>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: "20px" }}>
                <span>Total</span>
                <span>₱{total}</span>
              </div>
              <button onClick={handleSubmit} style={{ width: "100%", background: "#0d1240", color: "#fff", border: "none", borderRadius: "10px", padding: "12px 0", fontWeight: 600, cursor: "pointer" }}>
                Place Order
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
