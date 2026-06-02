"use client";

import React, { useState, useEffect } from "react";
import CustomerNavbar from "../../../components/home-customer/CustomerNavbar";
import { authApi, ordersApi, productsApi, cartApi } from "@/lib/api"; // Adjust this import path as needed
import type { Order, Product, CartOrderLineItem } from "@/types/mytypes";

type EnrichedOrder = Order & {
  itemsSummary: string;
};

export default function TrackOrderPage() {
  const [orders, setOrders] = useState<EnrichedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomerOrders() {
      try {
        setLoading(true);
        // 1. Get the current logged-in user profile
        const authData = await authApi.me();
        if (!authData?.user?.id) {
          setError("You must be logged in to view your orders.");
          setLoading(false);
          return;
        }

        const customerId = authData.user.id;

        // 2. Fetch all orders for this customer and the master products directory concurrently
        const [customerOrders, allProducts] = await Promise.all([
          ordersApi.getByCustomer(customerId),
          productsApi.list(),
        ]);

        // Create a fast lookup map for product names by their ID
        const productMap = new Map<number, string>();
        allProducts.forEach((p) => productMap.set(p.prod_id, p.prod_name));

        // 3. For each order, fetch its cart items to compile the combined product names
        const enrichedOrders: EnrichedOrder[] = await Promise.all(
          customerOrders.map(async (order) => {
            try {
              const lineItems: CartOrderLineItem[] = await cartApi.getByOrder(order.ord_id);
              
              // Map line items to strings like "2x Cinnamon Cookie"
              const namesArray = lineItems.map((item) => {
                const prodName = productMap.get(item.prod_id) || "Unknown Cookie";
                return `${item.cart_quan}x ${prodName}`;
              });

              return {
                ...order,
                itemsSummary: namesArray.length > 0 ? namesArray.join(", ") : "No items listed",
              };
            } catch {
              // Fallback if individual cart retrieval fails
              return {
                ...order,
                itemsSummary: "Cookie Krave Assortment",
              };
            }
          })
        );

        // Sort orders so that the newest orders appear at the top
        enrichedOrders.sort((a, b) => b.ord_id - a.ord_id);

        setOrders(enrichedOrders);
      } catch (err: any) {
        console.error("Error loading tracking data:", err);
        setError("Failed to sync your orders from the server.");
      } finally {
        setLoading(false);
      }
    }

    loadCustomerOrders();
  }, []);

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
          Your Order History
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#6b6f8a",
            marginBottom: "40px",
          }}
        >
          Real-time status and fulfillment logs for all your cookie purchases.
        </p>

        {loading && (
          <p style={{ textAlign: "center", color: "#6b6f8a", fontSize: "16px" }}>
            Fetching your fresh orders...
          </p>
        )}

        {error && (
          <div
            style={{
              background: "#fff5f5",
              border: "1px solid #ffe3e3",
              borderRadius: "12px",
              padding: "20px",
              color: "#e53e3e",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <p style={{ textAlign: "center", color: "#6b6f8a", fontSize: "15px" }}>
            You haven't placed any cookie orders yet!
          </p>
        )}

        {!loading && !error && orders.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {orders.map((order) => {
              // ─── EXTRACT LOGIC VARIABLE DECLARATIONS (Easy to maintain) ───
              const orderId = `CK-${order.ord_id}`;
              const product_name = order.itemsSummary;
              const price = `₱${order.total_amount}`;
              const status = order.order_status;

              // Choose colors dynamically based on live status string
              let statusColor = "#c8883a"; // Pending / Baking
              if (status === "Completed") statusColor = "#2f855a";
              if (status === "Cancelled") statusColor = "#e53e3e";
              if (status === "Out for Delivery" || status === "For Pickup") statusColor = "#2b6cb0";

              return (
                <div
                  key={order.ord_id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2ddd6",
                    borderRadius: "16px",
                    padding: "28px",
                    boxShadow: "0 2px 8px rgba(13, 18, 64, 0.02)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      borderBottom: "1px solid #f3efe9",
                      paddingBottom: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#8c91a6",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Order ID
                      </span>
                      <h3
                        style={{
                          margin: "2px 0 0 0",
                          fontSize: "18px",
                          fontWeight: 700,
                        }}
                      >
                        {orderId}
                      </h3>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          background: `${statusColor}12`,
                          color: statusColor,
                          padding: "6px 14px",
                          borderRadius: "999px",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontSize: "13px", color: "#6b6f8a", display: "block", marginBottom: "4px" }}>
                      Items Ordered
                    </span>
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: 500, color: "#0d1240", lineHeight: 1.4 }}>
                      {product_name}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#fdfbfa",
                      padding: "12px 16px",
                      borderRadius: "8px",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: "#6b6f8a" }}>Amount Paid</span>
                    <strong style={{ fontSize: "18px", color: "#0d1240" }}>{price}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}