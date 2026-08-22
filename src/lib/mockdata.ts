import {
    BOMEntry,
    Rider,
    Order,
    OrderStatus,
    PaymentMethod,
    Fulfillment,
    FulfillmentType,
    Delivery,
    PickUp,
    CartOrderLineItem,
    Product,
    WeeklySummary,
    LowStockItem,
    InventoryItem,
    ApiResponse,
    PaginatedResponse,
} from "@/types"; // verify this resolves — you have both src/types/index.ts and src/types/mytypes.ts

// ─── Product ─────────────────────────────────────────────────────────────────
export const mockProducts: Product[] = [
    {
        product_id: 1,
        product_name: "Classic Chocolate Chip",
        product_description:
            "Our signature cookie loaded with semi-sweet chocolate chips.",
        price: 65,
        is_available: true,
        shelf_life: "7 days",
        image: "/images/products/classic-choc-chip.jpg",
    },
    {
        product_id: 2,
        product_name: "Double Fudge Brookie",
        product_description: "A dense brownie-cookie hybrid with fudge swirls.",
        price: 75,
        is_available: true,
        shelf_life: "5 days",
        image: "/images/products/double-fudge-brookie.jpg",
    },
    {
        product_id: 3,
        product_name: "Oatmeal Raisin",
        product_description:
            "Chewy oats and plump raisins with a hint of cinnamon.",
        price: 60,
        is_available: true,
        shelf_life: "7 days",
        image: "/images/products/oatmeal-raisin.jpg",
    },
    {
        product_id: 4,
        product_name: "Red Velvet Crinkle",
        product_description:
            "Cream cheese-studded red velvet cookie, crinkle-top finish.",
        price: 70,
        is_available: true,
        shelf_life: "6 days",
        image: "/images/products/red-velvet-crinkle.jpg",
    },
    {
        product_id: 5,
        product_name: "Matcha White Chocolate",
        product_description:
            "Ceremonial-grade matcha with white chocolate chunks.",
        price: 80,
        is_available: false,
        shelf_life: "5 days",
        image: "/images/products/matcha-white-choc.jpg",
    },
    {
        product_id: 6,
        product_name: "Snickerdoodle",
        product_description: "Soft-baked and rolled in cinnamon sugar.",
        price: 55,
        is_available: true,
        shelf_life: "7 days",
        image: "/images/products/snickerdoodle.jpg",
    },
];

// ─── Inventory ───────────────────────────────────────────────────────────────
export const mockInventory: InventoryItem[] = [
    {
        inventory_id: 1,
        ingredients_name: "All-Purpose Flour",
        current_stock: 45,
        unit_of_measure: "kg",
        recorder_trigger: 10,
    },
    {
        inventory_id: 2,
        ingredients_name: "Granulated Sugar",
        current_stock: 30,
        unit_of_measure: "kg",
        recorder_trigger: 8,
    },
    {
        inventory_id: 3,
        ingredients_name: "Unsalted Butter",
        current_stock: 12,
        unit_of_measure: "kg",
        recorder_trigger: 15,
    },
    {
        inventory_id: 4,
        ingredients_name: "Semi-Sweet Chocolate Chips",
        current_stock: 18,
        unit_of_measure: "kg",
        recorder_trigger: 10,
    },
    {
        inventory_id: 5,
        ingredients_name: "Eggs",
        current_stock: 20,
        unit_of_measure: "tray",
        recorder_trigger: 5,
    },
    {
        inventory_id: 6,
        ingredients_name: "Baking Soda",
        current_stock: 4,
        unit_of_measure: "kg",
        recorder_trigger: 5,
    },
    {
        inventory_id: 7,
        ingredients_name: "Vanilla Extract",
        current_stock: 3,
        unit_of_measure: "L",
        recorder_trigger: 2,
    },
    {
        inventory_id: 8,
        ingredients_name: "Rolled Oats",
        current_stock: 25,
        unit_of_measure: "kg",
        recorder_trigger: 8,
    },
    {
        inventory_id: 9,
        ingredients_name: "Matcha Powder",
        current_stock: 1,
        unit_of_measure: "kg",
        recorder_trigger: 3,
    },
];

// ─── BOM ─────────────────────────────────────────────────────────────────────
export const mockBOMEntries: BOMEntry[] = [
    // Classic Chocolate Chip (nested refs included as an example of the joined shape)
    {
        bom_id: 1,
        product_id: 1,
        inventory_id: 1,
        quantity_required: 0.5,
        product: mockProducts[0],
        inventory: mockInventory[0],
    },
    {
        bom_id: 2,
        product_id: 1,
        inventory_id: 2,
        quantity_required: 0.3,
        product: mockProducts[0],
        inventory: mockInventory[1],
    },
    {
        bom_id: 3,
        product_id: 1,
        inventory_id: 3,
        quantity_required: 0.25,
        product: mockProducts[0],
        inventory: mockInventory[2],
    },
    {
        bom_id: 4,
        product_id: 1,
        inventory_id: 4,
        quantity_required: 0.2,
        product: mockProducts[0],
        inventory: mockInventory[3],
    },
    {
        bom_id: 5,
        product_id: 1,
        inventory_id: 5,
        quantity_required: 0.1,
        product: mockProducts[0],
        inventory: mockInventory[4],
    },
    // Oatmeal Raisin
    { bom_id: 6, product_id: 3, inventory_id: 1, quantity_required: 0.4 },
    { bom_id: 7, product_id: 3, inventory_id: 8, quantity_required: 0.3 },
    { bom_id: 8, product_id: 3, inventory_id: 3, quantity_required: 0.2 },
    // Matcha White Chocolate
    { bom_id: 9, product_id: 5, inventory_id: 1, quantity_required: 0.35 },
    { bom_id: 10, product_id: 5, inventory_id: 9, quantity_required: 0.05 },
];

// ─── Rider ───────────────────────────────────────────────────────────────────
export const mockRiders: Rider[] = [
    {
        rider_id: "rdr-001",
        rider_name: "Marco Villanueva",
        rider_contact_num: "+63 917 123 4567",
        current_location: "Brgy. Poblacion, Makati City",
    },
    {
        rider_id: "rdr-002",
        rider_name: "Angela Reyes",
        rider_contact_num: "+63 918 234 5678",
        current_location: "Quezon City",
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
        current_location: "En route - EDSA Guadalupe",
    },
];

// ─── Fulfillment ─────────────────────────────────────────────────────────────
export const mockFulfillments: Fulfillment[] = [
    {
        fulfillment_id: 1,
        fulfillment_type: "Delivery",
        delivery: {
            fulfillment_id: 1,
            rider_id: "rdr-001",
            address: "123 Sampaguita St., Brgy. San Isidro, Makati City",
            contact_name: "Liza Fernandez",
            contact_number: "+63 915 555 1234",
            note: "Please ring the doorbell twice",
            floor_unit_num: "Unit 4B",
        },
    },
    {
        fulfillment_id: 2,
        fulfillment_type: "Pick_Up",
        pick_up: {
            fulfillment_id: 2,
            preferred_time: "2026-08-23T15:00:00+08:00",
            pick_up_location: "CookieKrave Main Branch - Katipunan",
        },
    },
    {
        fulfillment_id: 3,
        fulfillment_type: "Delivery",
        delivery: {
            fulfillment_id: 3,
            rider_id: "rdr-002",
            address: "45 Maligaya Ave., Brgy. Kristong Hari, Quezon City",
            contact_name: "Paolo Cruz",
            contact_number: "+63 917 888 2222",
        },
    },
    {
        fulfillment_id: 4,
        fulfillment_type: "Pick_Up",
        pick_up: {
            fulfillment_id: 4,
            preferred_time: "2026-08-24T10:30:00+08:00",
            pick_up_location: "CookieKrave Kiosk - SM North EDSA",
        },
    },
    {
        fulfillment_id: 5,
        fulfillment_type: "Delivery",
        delivery: {
            fulfillment_id: 5,
            // rider_id omitted - not yet assigned
            address: "78 Masikap St., Brgy. Central, Quezon City",
            contact_name: "Nina Alvarez",
            contact_number: "+63 928 111 3333",
            note: "Gate code 4521",
        },
    },
];

// ─── Cart / Order Line Item ──────────────────────────────────────────────────
export const mockCartOrderLineItems: CartOrderLineItem[] = [
    {
        order_id: 1001,
        product_id: 1,
        quantity: 2,
        price_per_item: 65,
        product: mockProducts[0],
    },
    {
        order_id: 1001,
        product_id: 4,
        quantity: 1,
        price_per_item: 70,
        product: mockProducts[3],
    },
    {
        order_id: 1002,
        product_id: 3,
        quantity: 3,
        price_per_item: 60,
        product: mockProducts[2],
    },
    {
        order_id: 1003,
        product_id: 1,
        quantity: 2,
        price_per_item: 65,
        product: mockProducts[0],
    },
    {
        order_id: 1004,
        product_id: 6,
        quantity: 1,
        price_per_item: 55,
        product: mockProducts[5],
    },
    {
        order_id: 1005,
        product_id: 2,
        quantity: 1,
        price_per_item: 75,
        product: mockProducts[1],
    },
    {
        order_id: 1005,
        product_id: 4,
        quantity: 1,
        price_per_item: 70,
        product: mockProducts[3],
    },
    {
        order_id: 1006,
        product_id: 1,
        quantity: 1,
        price_per_item: 65,
        product: mockProducts[0],
    },
    {
        order_id: 1007,
        product_id: 2,
        quantity: 1,
        price_per_item: 75,
        product: mockProducts[1],
    },
];

// ─── Order ───────────────────────────────────────────────────────────────────
// One order per OrderStatus value, mixed payment methods and fulfillment types.
export const mockOrders: Order[] = [
    {
        order_id: 1001,
        customer_id: "8f14e45f-ceea-4d5c-b6a1-0dfa8ce7a018",
        fulfillment_id: 1,
        order_time: "2026-08-20T09:15:00+08:00",
        total_amount: 200,
        ord_f_type: "Delivery",
        payment_method: "GCash",
        order_status: "Completed",
        fulfillment: mockFulfillments[0],
        cart_items: mockCartOrderLineItems.filter((i) => i.order_id === 1001),
    },
    {
        order_id: 1002,
        customer_id: "3c59dc04-8d88-4a34-9f60-b78d2e1bc1e8",
        fulfillment_id: 2,
        order_time: "2026-08-21T13:40:00+08:00",
        total_amount: 180,
        ord_f_type: "Pick_Up",
        payment_method: "Cash",
        order_status: "For Pickup",
        fulfillment: mockFulfillments[1],
        cart_items: mockCartOrderLineItems.filter((i) => i.order_id === 1002),
    },
    {
        order_id: 1003,
        customer_id: "a3f390d8-8e4c-4f4c-b3e8-e73b8f3b6e5b",
        fulfillment_id: 3,
        order_time: "2026-08-22T08:05:00+08:00",
        total_amount: 130,
        ord_f_type: "Delivery",
        payment_method: "GCash",
        order_status: "Baking",
        fulfillment: mockFulfillments[2],
        cart_items: mockCartOrderLineItems.filter((i) => i.order_id === 1003),
    },
    {
        order_id: 1004,
        customer_id: "5e884898-da28-4770-8926-2ee7dcc8a234",
        fulfillment_id: 4,
        order_time: "2026-08-24T09:00:00+08:00",
        total_amount: 55,
        ord_f_type: "Pick_Up",
        payment_method: "Cash",
        order_status: "Pending",
        fulfillment: mockFulfillments[3],
        cart_items: mockCartOrderLineItems.filter((i) => i.order_id === 1004),
    },
    {
        order_id: 1005,
        customer_id: "c1a67e77-2f78-49b0-9c0a-6acb64fa2d18",
        fulfillment_id: 5,
        order_time: "2026-08-22T07:30:00+08:00",
        total_amount: 145,
        ord_f_type: "Delivery",
        payment_method: "GCash",
        order_status: "Out for Delivery",
        fulfillment: mockFulfillments[4],
        cart_items: mockCartOrderLineItems.filter((i) => i.order_id === 1005),
    },
    {
        order_id: 1006,
        customer_id: "8f14e45f-ceea-4d5c-b6a1-0dfa8ce7a018", // repeat customer
        fulfillment_id: 1,
        order_time: "2026-08-19T16:00:00+08:00",
        total_amount: 65,
        ord_f_type: "Delivery",
        payment_method: "Cash",
        order_status: "Cancelled",
        cart_items: mockCartOrderLineItems.filter((i) => i.order_id === 1006),
    },
    {
        order_id: 1007,
        customer_id: "9f61e3bd-9ff9-4547-b0d4-1a3e4b1c9ea3",
        fulfillment_id: 2,
        order_time: "2026-08-22T10:00:00+08:00",
        total_amount: 75,
        ord_f_type: "Pick_Up",
        payment_method: "GCash",
        order_status: "Confirmed",
        fulfillment: mockFulfillments[1],
        cart_items: mockCartOrderLineItems.filter((i) => i.order_id === 1007),
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
    message: "Products retrieved successfully",
};

export const mockProductsApiErrorResponse: ApiResponse<null> = {
    data: null,
    error: "Failed to fetch products",
};

export const mockOrdersPaginatedResponse: PaginatedResponse<Order> = {
    data: mockOrders.slice(0, 5),
    total: mockOrders.length,
    page: 1,
    limit: 5,
};
