"use client";

import React, { useState, useEffect } from "react";
import CustomerNavbar from "../../../components/home-customer/CustomerNavbar";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const savedOrderId = localStorage.getItem("latestOrderId");

    if (savedOrderId) {
      setOrderId(savedOrderId);
      setSearched(true);
    }
  }, []);

  const orderStatus = {
    status: "Baking",
    estimatedTime: "30–45 minutes",
    steps: [
      { label: "Order Received", complete: true },
      { label: "Baking", complete: true },
      { label: "Ready for Pickup", complete: false },
      { label: "Completed", complete: false },
    ],
  };

  const handleTrack = () => {
    if (!orderId.trim()) return;
    setSearched(true);
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#fdf8f2",
        minHeight: "100vh",
        color: "#0d1240",
      }}
    >
      <CustomerNavbar />

      {/* Main Content */}
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "80px 40px",
        }}
      >
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "42px",
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          Track Your Order
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#6b6f8a",
            marginBottom: "40px",
          }}
        >
          Enter your Cookie Krave order ID below.
        </p>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2ddd6",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <input
            type="text"
            placeholder="Enter Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid #d8d2cb",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={handleTrack}
            style={{
              width: "100%",
              background: "#0d1240",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "14px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Track Order
          </button>
        </div>

        {searched && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2ddd6",
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                marginBottom: "16px",
              }}
            >
              Order Status
            </h2>

            <p style={{ color: "#6b6f8a", marginBottom: "8px" }}>
              Order ID: <strong>{orderId}</strong>
            </p>

            <p style={{ marginBottom: "24px" }}>
              Current Status:{" "}
              <strong style={{ color: "#c8883a" }}>
                {orderStatus.status}
              </strong>
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {orderStatus.steps.map((step, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: step.complete
                        ? "#0d1240"
                        : "#d9d9d9",
                    }}
                  />

                  <span
                    style={{
                      color: step.complete ? "#0d1240" : "#888888",
                      fontWeight: step.complete ? 600 : 400,
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                background: "#fdf8f2",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            >
              Estimated Completion Time:
              <strong>{orderStatus.estimatedTime}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}