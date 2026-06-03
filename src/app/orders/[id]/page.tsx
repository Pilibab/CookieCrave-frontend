"use client";

import { useFetch, useMutation } from "@/hooks/useFetch";
import { ordersApi, customersApi, fulfillmentApi, deliveryApi, pickupApi, cartApi, productsApi} from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { OrderStatus } from "@/types/mytypes";

const STATUS_FLOW: OrderStatus[] = [
  "Pending", "Confirmed", "Baking", "Out for Delivery", "For Pickup", "Completed", "Cancelled"
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);

  // ─── SINGLE UNIFIED FETCH CALL ─────────────────────────────────────────────
  const { data: pageData, loading, error, refetch } = useFetch(async () => {
    // 1. Fetch the core order details (Crucial - if this fails, throw)
    const orderData = await ordersApi.get(orderId);
    if (!orderData) throw new Error("Core order record not found");

    // 2. Fetch basic related collections concurrently with individual error safety shields
    const [customerData, fulfillmentData, cartItems] = await Promise.all([
      // If customer is missing or deleted, return null instead of crashing the page
      customersApi.get(String(orderData.cust_id))
        .catch((err) => {
          console.warn(`Customer ID ${orderData.cust_id} could not be resolved:`, err);
          return null;
        }),
      
      fulfillmentApi.get(orderData.fulfillment_id)
        .catch((err) => {
          console.warn(`Fulfillment ID ${orderData.fulfillment_id} could not be resolved:`, err);
          return null;
        }),
      
      cartApi.getByOrder(orderData.ord_id)
        .catch((err) => {
          console.warn(`Cart manifest items for Order ${orderData.ord_id} failed to load:`, err);
          return []; // Fallback to an empty list so the application can continue mapping
        }),
    ]);

    // 3. Fetch specific sub-fulfillment records conditionally based on type
    let deliveryData = null;
    let pickupData = null;

    if (fulfillmentData?.fulfillment_type === "Delivery") {
      try {
        deliveryData = await deliveryApi.get(orderData.fulfillment_id);
      } catch (err) {
        console.error("Failed to load sub-fulfillment delivery log details:", err);
      }
    } else if (fulfillmentData?.fulfillment_type === "Pick_Up") {
      try {
        pickupData = await pickupApi.get(orderData.fulfillment_id);
      } catch (err) {
        console.error("Failed to load sub-fulfillment pickup scheduling details:", err);
      }
    }

    // 4. Hydrate the cart line items with product descriptions concurrently
    const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
    const hydratedCart = await Promise.all(
      safeCartItems.map(async (item) => {
        try {
          const productInfo = await productsApi.get(item.prod_id);
          return {
            ...item,
            product: productInfo,
          };
        } catch (err) {
          console.error(`Failed to hydrate product info for ID ${item.prod_id}:`, err);
          return { ...item, product: null };
        }
      })
    );

    // Return the single consolidated state payload safely
    return {
      order: orderData,
      customer: customerData,
      fulfillment: fulfillmentData,
      delivery: deliveryData,
      pickup: pickupData,
      cart: hydratedCart,
    };
  }, [orderId]);

  const { mutate: updateStatus, loading: updating } = useMutation(
    (status: OrderStatus) => ordersApi.updateStatus(orderId, status)
  );

  const handleStatusChange = async (status: OrderStatus) => {
    await updateStatus(status);
    refetch(); 
  };

  if (loading) return <div className="page-body"><div className="spinner" /></div>;
  if (error || !pageData) return <div className="page-body"><p style={{ color: "red" }}>Order data could not be parsed.</p></div>;

  const { order, customer, fulfillment, delivery, pickup, cart } = pageData;
  const currentIdx = STATUS_FLOW.indexOf(order.order_status as OrderStatus);
  
  return (
    <div className="page-body">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/orders" style={{ color: "#6b6f8a", fontSize: 14 }}>← Orders</Link>
          <h1 className="page-title">Order #{order.ord_id}</h1>
        </div>
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
          {customer ? (
            <dl style={dl}>
              <dt>Name</dt>
              <dd>{customer.cust_firstname} {customer.cust_middlename ?? ""} {customer.cust_lastname}</dd>
              <dt>Email</dt>
              <dd>{customer.cust_email}</dd>
              <dt>Contact</dt>
              <dd>{customer.cust_cont_no ?? "—"}</dd>
            </dl>
          ) : <p style={{ color: "#6b6f8a" }}>No info</p>}
        </div>

        {/* Fulfillment info */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Fulfillment</h3>
          <dl style={dl}>
            <dt>Type</dt>
            <dd>{fulfillment?.fulfillment_type ?? "—"}</dd>
            {fulfillment?.fulfillment_type === "Delivery" && delivery && (
              <>
                <dt>Address</dt>
                <dd>{delivery.address}</dd>
                {delivery.floor_unit_num && (
                  <><dt>Unit/Floor</dt><dd>{delivery.floor_unit_num}</dd></>
                )}
                {delivery.note && (
                  <><dt>Note</dt><dd>{delivery.note}</dd></>
                )}
              </>
            )}
            {fulfillment?.fulfillment_type === "Pick_Up" && pickup && (
              <>
                <dt>Preferred Time</dt>
                <dd>{pickup.preferred_time ?? "—"}</dd>
                <dt>Pick-up Location</dt>
                <dd>{pickup.pick_up_location ?? "—"}</dd>
              </>
            )}
            <dt>Payment</dt>
            <dd>{order.ord_pay_meth}</dd>
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
              {(cart ?? []).map((item) => {
                const price = item.product?.prod_price ?? 0;
                const quantity = item.cart_quan ?? 0;
                const subtotal = price * quantity;

                return (
                  <tr key={item.prod_id}>
                    <td>{item.product?.prod_name ?? `Product #${item.prod_id}`}</td>
                    <td>₱{price.toFixed(2)}</td>
                    <td>{quantity}</td>
                    <td style={{ fontWeight: 600 }}>
                      ₱{subtotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
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
