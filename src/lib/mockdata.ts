import {
    BOMEntry,
    Rider,
    Customer,
    Order,
    // OrderStatus,
    PaymentMethod,
    Fulfillment,
    FulfillmentType,
    Delivery,
    PickUp,
    CartOrderLineItem,
    WeeklySummary,
    LowStockItem,
    InventoryItem,
    ApiResponse,
    PaginatedResponse,
    Product,
} from "@/types"; // verify this resolves — you have both src/types/index.ts and src/types/mytypes.ts

// ─── Customer ───────────────────────────────────────────────────────────────
export const mockCustomers: Customer[] = [
    {
        cust_id: "8f14e45f-ceea-4d5c-b6a1-0dfa8ce7a018",
        cust_lastname: "Fernandez",
        cust_firstname: "Liza",
        cust_email: "liza.fernandez@example.com",
        cust_cd: "Makati City",
        cust_social_provider: "google",
    },
    {
        cust_id: "3c59dc04-8d88-4a34-9f60-b78d2e1bc1e8",
        cust_lastname: "Cruz",
        cust_firstname: "Paolo",
        cust_email: "paolo.cruz@example.com",
        cust_cd: "Quezon City",
        cust_social_provider: "google",
    },
    {
        cust_id: "a3f390d8-8e4c-4f4c-b3e8-e73b8f3b6e5b",
        cust_lastname: "Reyes",
        cust_firstname: "Mia",
        cust_email: "mia.reyes@example.com",
        cust_cd: "Quezon City",
        cust_social_provider: "google",
    },
    {
        cust_id: "5e884898-da28-4770-8926-2ee7dcc8a234",
        cust_lastname: "Santos",
        cust_firstname: "Janelle",
        cust_email: "janelle.santos@example.com",
        cust_cd: "Manila City",
        cust_social_provider: "google",
    },
    {
        cust_id: "c1a67e77-2f78-49b0-9c0a-6acb64fa2d18",
        cust_lastname: "Alvarez",
        cust_firstname: "Nina",
        cust_email: "nina.alvarez@example.com",
        cust_cd: "Quezon City",
        cust_social_provider: "google",
    },
    {
        cust_id: "9f61e3bd-9ff9-4547-b0d4-1a3e4b1c9ea3",
        cust_lastname: "Garcia",
        cust_firstname: "Carlo",
        cust_email: "carlo.garcia@example.com",
        cust_cd: "Pasig City",
        cust_social_provider: "google",
    },
];

// ─── prod_id ─────────────────────────────────────────────────────────────────
export const mockProducts: Product[] = [
    {
        prod_id: 1,
        prod_name: "Classic Chocolate Chip",
        prod_desc:
            "Our signature cookie loaded with semi-sweet chocolate chips.",
        prod_price: 65,
        prod_available: true,
        prod_sl: "7 days",
        prod_image_url: "/prod_image_urls/prod_ids/classic-choc-chip.jpg",
    },
    {
        prod_id: 2,
        prod_name: "Double Fudge Brookie",
        prod_desc: "A dense brownie-cookie hybrid with fudge swirls.",
        prod_price: 75,
        prod_available: true,
        prod_sl: "5 days",
        prod_image_url: "/prod_image_urls/prod_ids/double-fudge-brookie.jpg",
    },
    {
        prod_id: 3,
        prod_name: "Oatmeal Raisin",
        prod_desc:
            "Chewy oats and plump raisins with a hint of cinnamon.",
        prod_price: 60,
        prod_available: true,
        prod_sl: "7 days",
        prod_image_url: "/prod_image_urls/prod_ids/oatmeal-raisin.jpg",
    },
    {
        prod_id: 4,
        prod_name: "Red Velvet Crinkle",
        prod_desc:
            "Cream cheese-studded red velvet cookie, crinkle-top finish.",
        prod_price: 70,
        prod_available: true,
        prod_sl: "6 days",
        prod_image_url: "/prod_image_urls/prod_ids/red-velvet-crinkle.jpg",
    },
    {
        prod_id: 5,
        prod_name: "Matcha White Chocolate",
        prod_desc:
            "Ceremonial-grade matcha with white chocolate chunks.",
        prod_price: 80,
        prod_available: false,
        prod_sl: "5 days",
        prod_image_url: "/prod_image_urls/prod_ids/matcha-white-choc.jpg",
    },
    {
        prod_id: 6,
        prod_name: "Snickerdoodle",
        prod_desc: "Soft-baked and rolled in cinnamon sugar.",
        prod_price: 55,
        prod_available: true,
        prod_sl: "7 days",
        prod_image_url: "/prod_image_urls/prod_ids/snickerdoodle.jpg",
    },
];

// ─── Inventory ───────────────────────────────────────────────────────────────
export const mockInventory: InventoryItem[] = [
    {
        inv_id: 1,
        inv_ing_name: "All-Purpose Flour",
        inv_stock: 45,
        inv_uom: "kg",
        inv_rt: 10,
    },
    {
        inv_id: 2,
        inv_ing_name: "Granulated Sugar",
        inv_stock: 30,
        inv_uom: "kg",
        inv_rt: 8,
    },
    {
        inv_id: 3,
        inv_ing_name: "Unsalted Butter",
        inv_stock: 12,
        inv_uom: "kg",
        inv_rt: 15,
    },
    {
        inv_id: 4,
        inv_ing_name: "Semi-Sweet Chocolate Chips",
        inv_stock: 18,
        inv_uom: "kg",
        inv_rt: 10,
    },
    {
        inv_id: 5,
        inv_ing_name: "Eggs",
        inv_stock: 20,
        inv_uom: "tray",
        inv_rt: 5,
    },
    {
        inv_id: 6,
        inv_ing_name: "Baking Soda",
        inv_stock: 4,
        inv_uom: "kg",
        inv_rt: 5,
    },
    {
        inv_id: 7,
        inv_ing_name: "Vanilla Extract",
        inv_stock: 3,
        inv_uom: "L",
        inv_rt: 2,
    },
    {
        inv_id: 8,
        inv_ing_name: "Rolled Oats",
        inv_stock: 25,
        inv_uom: "kg",
        inv_rt: 8,
    },
    {
        inv_id: 9,
        inv_ing_name: "Matcha Powder",
        inv_stock: 1,
        inv_uom: "kg",
        inv_rt: 3,
    },
];

// ─── BOM ─────────────────────────────────────────────────────────────────────
export const mockBOMEntries: BOMEntry[] = [
    // Classic Chocolate Chip (nested refs included as an example of the joined shape)
    {
        bom_id: 1,
        prod_id: 1,
        inv_id: 1,
        bom_quan_req: 0.5,
    },
    {
        bom_id: 2,
        prod_id: 1,
        inv_id: 2,
        bom_quan_req: 0.3,
    },
    {
        bom_id: 3,
        prod_id: 1,
        inv_id: 3,
        bom_quan_req: 0.25,
    },
    {
        bom_id: 4,
        prod_id: 1,
        inv_id: 4,
        bom_quan_req: 0.2,
    },
    {
        bom_id: 5,
        prod_id: 1,
        inv_id: 5,
        bom_quan_req: 0.1,
    },
    // Oatmeal Raisin
    { bom_id: 6, prod_id: 3, inv_id: 1, bom_quan_req: 0.4 },
    { bom_id: 7, prod_id: 3, inv_id: 8, bom_quan_req: 0.3 },
    { bom_id: 8, prod_id: 3, inv_id: 3, bom_quan_req: 0.2 },
    // Matcha White Chocolate
    { bom_id: 9, prod_id: 5, inv_id: 1, bom_quan_req: 0.35 },
    { bom_id: 10, prod_id: 5, inv_id: 9, bom_quan_req: 0.05 },
];

// ─── Rider ───────────────────────────────────────────────────────────────────
export const mockRiders: Rider[] = [
    {
        rider_id: "rdr-001",
        rider_name: "Marco Villanueva",
        rider_contact_num: "+63 917 123 4567",
    },
    {
        rider_id: "rdr-002",
        rider_name: "Angela Reyes",
        rider_contact_num: "+63 918 234 5678",
    },
    {
        rider_id: "rdr-003",
        rider_name: "Julius Bermudez",
        rider_contact_num: "+63 920 345 6789",
    }, // currently offline, no location
    {
        rider_id: "rdr-004",
        rider_name: "Katrina Solano",
        rider_contact_num: "+63 999 456 7890",
    },
];

// ─── Fulfillment ─────────────────────────────────────────────────────────────
export const mockFulfillments: Fulfillment[] = [
    {
        fulfillment_id: 1,
        fulfillment_type: "Delivery",
    },
    {
        fulfillment_id: 2,
        fulfillment_type: "Pick_Up",
    },
    {
        fulfillment_id: 3,
        fulfillment_type: "Delivery",
    },
    {
        fulfillment_id: 4,
        fulfillment_type: "Pick_Up",
    },
    {
        fulfillment_id: 5,
        fulfillment_type: "Delivery",
    },
];

export const mockDeliveries: Delivery[] = [
    {
        fulfillment_id: 1,
        rider_id: "rdr-001",
        address: "123 Sampaguita St., Brgy. San Isidro, Makati City",
        contact_name: "Liza Fernandez",
        contact_number: "+63 915 555 1234",
        note: "Please ring the doorbell twice",
        floor_unit_num: "Unit 4B",
    },
    {
        fulfillment_id: 3,
        rider_id: "rdr-002",
        address: "45 Maligaya Ave., Brgy. Kristong Hari, Quezon City",
        contact_name: "Paolo Cruz",
        contact_number: "+63 917 888 2222",
    },
    {
        fulfillment_id: 5,
        address: "78 Masikap St., Brgy. Central, Quezon City",
        contact_name: "Nina Alvarez",
        contact_number: "+63 928 111 3333",
        note: "Gate code 4521",
    },
];

export const mockPickUps: PickUp[] = [
    {
        fulfillment_id: 2,
        preferred_time: "2026-08-23T15:00:00+08:00",
        pick_up_location: "CookieKrave Main Branch - Katipunan",
    },
    {
        fulfillment_id: 4,
        preferred_time: "2026-08-24T10:30:00+08:00",
        pick_up_location: "CookieKrave Kiosk - SM North EDSA",
    },
];

// ─── Cart / Order Line Item ──────────────────────────────────────────────────
export const mockCartOrderLineItems: CartOrderLineItem[] = [
    {
        ord_id: 1001,
        prod_id: 1,
        cart_quan: 2,
    },
    {
        ord_id: 1001,
        prod_id: 4,
        cart_quan: 1,
    },
    {
        ord_id: 1002,
        prod_id: 3,
        cart_quan: 3,
    },
    {
        ord_id: 1003,
        prod_id: 1,
        cart_quan: 2,
    },
    {
        ord_id: 1004,
        prod_id: 6,
        cart_quan: 1,
    },
    {
        ord_id: 1005,
        prod_id: 2,
        cart_quan: 1,
    },
    {
        ord_id: 1005,
        prod_id: 4,
        cart_quan: 1,
    },
    {
        ord_id: 1006,
        prod_id: 1,
        cart_quan: 1,
    },
    {
        ord_id: 1007,
        prod_id: 2,
        cart_quan: 1,
    },
];

// ─── Order ───────────────────────────────────────────────────────────────────
// One order per OrderStatus value, mixed payment methods and fulfillment types.
export const mockOrders: Order[] = [
    {
        ord_id: 1001,
        cust_id: "8f14e45f-ceea-4d5c-b6a1-0dfa8ce7a018",
        fulfillment_id: 1,
        ord_time: new Date("2026-08-20T09:15:00+08:00"),
        total_amount: 200,
        ord_pay_meth: "GCash",
        order_status: "Completed",
        ord_fulfillment_time: new Date("2026-08-20T09:15:00+10:00")
        // fulfillment: mockFulfillments[0],
        // cart_items: mockCartOrderLineItems.filter((i) => i.ord_id === 1001),
    },
    {
        ord_id: 1002,
        cust_id: "3c59dc04-8d88-4a34-9f60-b78d2e1bc1e8",
        fulfillment_id: 2,
        ord_time: new Date("2026-08-21T13:40:00+08:00"),
        ord_fulfillment_time: new Date("2026-08-21T13:40:00+08:00"),
        total_amount: 180,
        ord_pay_meth: "Cash",
        order_status: "For Pickup",
        // cart_items: mockCartOrderLineItems.filter((i) => i.ord_id === 1002),
    },
    {
        ord_id: 1003,
        cust_id: "a3f390d8-8e4c-4f4c-b3e8-e73b8f3b6e5b",
        fulfillment_id: 3,
        ord_time: new Date("2026-08-22T08:05:00+08:00"),
        ord_fulfillment_time: new Date("2026-08-22T08:05:00+08:00"),
        total_amount: 130,
        ord_pay_meth: "GCash",
        order_status: "Baking",
        // cart_items: mockCartOrderLineItems.filter((i) => i.ord_id === 1003),
    },
    {
        ord_id: 1004,
        cust_id: "5e884898-da28-4770-8926-2ee7dcc8a234",
        fulfillment_id: 4,
        ord_time: new Date("2026-08-24T09:00:00+08:00"),
        ord_fulfillment_time: new Date("2026-08-24T09:00:00+08:00"),
        total_amount: 55,
        ord_pay_meth: "Cash",
        order_status: "Pending",
        // cart_items: mockCartOrderLineItems.filter((i) => i.ord_id === 1004),
    },
    {
        ord_id: 1005,
        cust_id: "c1a67e77-2f78-49b0-9c0a-6acb64fa2d18",
        fulfillment_id: 5,
        ord_time: new Date("2026-08-22T07:30:00+08:00"),
        ord_fulfillment_time: new Date("2026-08-22T07:30:00+08:00"),
        total_amount: 145,
        ord_pay_meth: "GCash",
        order_status: "Out for Delivery",
        // fulfillment: mockFulfillments[4],
        // cart_items: mockCartOrderLineItems.filter((i) => i.ord_id === 1005),
    },
    {
        ord_id: 1006,
        cust_id: "8f14e45f-ceea-4d5c-b6a1-0dfa8ce7a018", // repeat customer
        fulfillment_id: 1,
        ord_time: new Date("2026-08-19T16:00:00+08:00"),
        ord_fulfillment_time: new Date("2026-08-19T16:00:00+08:00"),
        total_amount: 65,
        ord_pay_meth: "Cash",
        order_status: "Cancelled",
        // cart_items: mockCartOrderLineItems.filter((i) => i.ord_id === 1006),
    },
    {
        ord_id: 1007,
        cust_id: "9f61e3bd-9ff9-4547-b0d4-1a3e4b1c9ea3",
        fulfillment_id: 2,
        ord_time: new Date("2026-08-22T10:00:00+08:00"),
        ord_fulfillment_time: new Date("2026-08-22T10:00:00+08:00"),
        total_amount: 75,
        ord_pay_meth: "GCash",
        order_status: "Confirmed",
        // fulfillment: mockFulfillments[1],
        // cart_items: mockCartOrderLineItems.filter((i) => i.ord_id === 1007),
    },
];

// ─── Reports / Aggregates ────────────────────────────────────────────────────
export const mockWeeklySummary: WeeklySummary = {
    week_start: "2026-08-17",
    week_end: "2026-08-23",
    total_orders: 7,
    completed_orders: 1,
    total_revenue: 785, // sum of all non-cancelled order totals
    orders_by_status: {
        Pending: 1,
        Confirmed: 1,
        Baking: 1,
        "Out for Delivery": 1,
        "For Pickup": 1,
        Completed: 1,
        Cancelled: 1,
    },
};

export const mockLowStockItems: LowStockItem[] = [
    { ...mockInventory[2], is_low: true }, // Unsalted Butter: 12 < trigger 15
    { ...mockInventory[5], is_low: true }, // Baking Soda: 4 < trigger 5
    { ...mockInventory[8], is_low: true }, // Matcha Powder: 1 < trigger 3
];

// ─── API Response Wrappers ───────────────────────────────────────────────────
export const mockProductsApiResponse: ApiResponse<Product[]> = {
    data: mockProducts,
    message: "prod_ids retrieved successfully",
};

export const mockProductsApiErrorResponse: ApiResponse<null> = {
    data: null,
    error: "Failed to fetch prod_ids",
};

export const mockOrdersPaginatedResponse: PaginatedResponse<Order> = {
    data: mockOrders.slice(0, 5),
    total: mockOrders.length,
    page: 1,
    limit: 5,
};
