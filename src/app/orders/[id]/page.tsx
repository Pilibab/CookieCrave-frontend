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
    // 1. Fetch the core order details
    const orderData = await ordersApi.get(orderId);

    // 2. Fetch basic related collections concurrently
    const [customerData, fulfillmentData, cartItems] = await Promise.all([
      customersApi.get(String(orderData.cust_id)),
      fulfillmentApi.get(orderData.fulfillment_id),
      cartApi.getByOrder(orderData.ord_id),
    ]);

    // 3. Fetch specific sub-fulfillment records conditionally based on type
    let deliveryData = null;
    let pickupData = null;

    if (fulfillmentData.fulfillment_type === "Delivery") {
      deliveryData = await deliveryApi.get(orderData.fulfillment_id);
    } else if (fulfillmentData.fulfillment_type === "Pick_Up") {
      pickupData = await pickupApi.get(orderData.fulfillment_id);
    }

    // 4. Hydrate the cart line items with product descriptions concurrently
    const hydratedCart = await Promise.all(
      cartItems.map(async (item) => {
        try {
          const productInfo = await productsApi.get(item.prod_id);
          return {
            ...item,
            product: productInfo, // Injected product object safely inside the array loop
          };
        } catch (err) {
          console.error(`Failed to hydrate product info for ID ${item.prod_id}:`, err);
          return { ...item, product: null };
        }
      })
    );

    // Return the single consolidated state payload
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
    refetch(); // This cleanly re-runs the entire aggregated data tree
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
        {/* <span style={{ fontSize: 13, color: "#6b6f8a" }}>
          Invoice: {order.invoice ? `#${order.invoice.invoice_id}` : "Pending"}     no invoice
        </span> */}
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
          ) : <p style={{ color: "#6b6f8a" }}>
            {/* {should customer be null then dont display info }  */}
            No info </p>}
        </div>

        {/* Fulfillment info */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Fulfillment</h3>
          <dl style={dl}>
            <dt>Type</dt>
            <dd>{fulfillment?.fulfillment_type ?? "—"}</dd>
            {fulfillment?.fulfillment_type  === "Delivery" && delivery && (
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
            {fulfillment?.fulfillment_type  === "Pick_Up" && pickup && (
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
                  // 1. Safely extract values with safe numeric fallbacks to satisfy TypeScript
                  const price = item.product?.prod_price ?? 0;
                  const quantity = item.cart_quan ?? 0;
                  const subtotal = price * quantity;

                  return (
                    <tr key={item.prod_id}>
                      {/* Access the hydrated product object properties safely */}
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


// ! ----------------- SCRATCH------------------
  // ! retrieve order info 
  // const { data: order, loading, error, refetch } = useFetch(
  //   () => ordersApi.get(orderId),
  //   [orderId]
  // );

  // const { mutate: updateStatus, loading: updating } = useMutation(
  //   (status: OrderStatus) => ordersApi.updateStatus(orderId, status)
  // );

  // const handleStatusChange = async (status: OrderStatus) => {
  //   await updateStatus(status);
  //   refetch();
  // };

  // if (loading) return <div className="page-body"><div className="spinner" /></div>;
  // if (error || !order) return <div className="page-body"><p style={{ color: "red" }}>Order not found.</p></div>;

  // const currentIdx = STATUS_FLOW.indexOf(order.order_status as OrderStatus);

  // // ! retrieve othe info but shit... dont i have the dashboard adapter? i think its just the same ahh.....
  // const { data: customer, loading: cust_loading , error: cust_err, refetch: cust_refetch } = useFetch(
  //   () => customersApi.get(order.cust_id),
  //   [order.cust_id]
  // );  
  // const { data: fulfillment, loading: fullfillment_loading , error: fullfillment_err, refetch: fullfillment_refetch } = useFetch(
  //   () => fulfillmentApi.get(order.fulfillment_id),
  //   [order.fulfillment_id]
  // );

  // const { data: delivery, loading: delievery_loading , error: delievery_err, refetch: delievery_refetch } = useFetch(
  //   () => deliveryApi.get(order.fulfillment_id),
  //   [order.fulfillment_id]
  // );  
  // const { data: pickup, loading: pickup_loading , error: pickup_err, refetch: pickup_refetch } = useFetch(
  //   () => pickupApi.get(order.fulfillment_id),
  //   [order.fulfillment_id]
  // );

  // const { data: cart, loading: cart_loading , error: cart_err, refetch: cart_refetch } = useFetch(
  //   () => cartApi.getByOrder(order.ord_id),
  //   [order.ord_id]
  // );

  // const { data: product, loading: product_loading , error: product_err, refetch: product_refetch } = useFetch(
  //   () => productsApp,
  //   [order.ord_id]
  // );
  // If the ID is a number, cast it using String() so TypeScript is happy: