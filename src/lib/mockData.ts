// ─── Mock Data for UI preview (no backend needed) ────────────────────────────
import type {
    Customer, Product, InventoryItem, Order, WeeklySummary, LowStockItem, Rider
} from "@/types/index";

export const mockCustomers: Customer[] = [
    { customer_id: "1", given_name: "Maria", middle_name: "S", last_name: "Santos", email: "maria@email.com", contact_num: "09171234567", created_at: "2025-01-10T00:00:00Z" },
    { customer_id: "2", given_name: "Juan", last_name: "dela Cruz", email: "juan@email.com", contact_num: "09281234567", created_at: "2025-02-14T00:00:00Z" },
    { customer_id: "3", given_name: "Ana", middle_name: "R", last_name: "Reyes", suffix: "Jr.", email: "ana@email.com", contact_num: "09391234567", created_at: "2025-03-01T00:00:00Z" },
    { customer_id: "4", given_name: "Carlo", last_name: "Mendoza", email: "carlo@email.com", created_at: "2025-03-20T00:00:00Z" },
];

export const mockProducts: Product[] = [
    { product_id: 1, 
        product_name: "Classic Choco Chip", 
        product_description: "Buttery cookie loaded with semi-sweet chocolate chips.", 
        price: 65, is_available: true, shelf_life: "3 days", image: "/cookie-choco-biscoff.png" 
    },
    { product_id: 2, product_name: "Red Velvet Crinkle", product_description: "Soft red velvet crinkle dusted with powdered sugar.", price: 75, is_available: true, shelf_life: "3 days", image: "/cookie-strawberry.png" },
    { product_id: 3, product_name: "Matcha Latte Cookie", product_description: "Earthy matcha paired with white chocolate chunks.", price: 80, is_available: false, shelf_life: "2 days", image: "/cookie-snowman.png" },
    { product_id: 4, product_name: "S'mores Cookie Bar", product_description: "Graham cracker base, gooey marshmallow, chocolate top.", price: 90, is_available: true, shelf_life: "4 days", image: "/cookie-holiday.png" },
];

export const mockInventory: InventoryItem[] = [
    { inventory_id: 1, ingredients_name: "All-Purpose Flour", current_stock: 5, unit_of_measure: "kg", recorder_trigger: 10 },
    { inventory_id: 2, ingredients_name: "Butter", current_stock: 15, unit_of_measure: "kg", recorder_trigger: 5 },
    { inventory_id: 3, ingredients_name: "Chocolate Chips", current_stock: 8, unit_of_measure: "kg", recorder_trigger: 3 },
    { inventory_id: 4, ingredients_name: "Eggs", current_stock: 2, unit_of_measure: "trays", recorder_trigger: 3 },
];

export const mockLowStock: LowStockItem[] = [
    { inventory_id: 1, ingredients_name: "All-Purpose Flour", current_stock: 5, unit_of_measure: "kg", recorder_trigger: 10, is_low: true },
    { inventory_id: 4, ingredients_name: "Eggs", current_stock: 2, unit_of_measure: "trays", recorder_trigger: 3, is_low: true },
];

export const mockOrders: Order[] = [
    {
        order_id: 1042, customer_id: "1", fulfillment_id: 1,
        order_time: "2025-05-25T09:30:00Z", total_amount: 390,
        payment_method: "GCash", order_status: "Confirmed",
        customer: mockCustomers[0],
        fulfillment: { fulfillment_id: 1, fulfillment_type: "Delivery", delivery: { fulfillment_id: 1, address: "123 Katipunan Ave, QC" } },
        cart_items: [
        { order_id: 1042, product_id: 1, quantity: 3, price_per_item: 65, product: mockProducts[0] },
        { order_id: 1042, product_id: 2, quantity: 2, price_per_item: 75, product: mockProducts[1] },
        { order_id: 1042, product_id: 4, quantity: 1, price_per_item: 90, product: mockProducts[3] },
        ],
    },
    {
        order_id: 1041, customer_id: "2", fulfillment_id: 2,
        order_time: "2025-05-25T08:10:00Z", total_amount: 155,
        payment_method: "Cash", order_status: "Baking",
        customer: mockCustomers[1],
        fulfillment: { fulfillment_id: 2, fulfillment_type: "Pick_Up", pick_up: { fulfillment_id: 2, preferred_time: "11:00 AM", pick_up_location: "Main Branch" } },
        cart_items: [
        { order_id: 1041, product_id: 2, quantity: 1, price_per_item: 75, product: mockProducts[1] },
        { order_id: 1041, product_id: 3, quantity: 1, price_per_item: 80, product: mockProducts[2] },
        ],
    },
    {
        order_id: 1040, customer_id: "3", fulfillment_id: 3,
        order_time: "2025-05-24T14:00:00Z", total_amount: 260,
        payment_method: "GCash", order_status: "Completed",
        customer: mockCustomers[2],
        fulfillment: { fulfillment_id: 3, fulfillment_type: "Delivery", delivery: { fulfillment_id: 3, address: "456 Maginhawa St, QC" } },
        cart_items: [
        { order_id: 1040, product_id: 4, quantity: 2, price_per_item: 90, product: mockProducts[3] },
        { order_id: 1040, product_id: 1, quantity: 1, price_per_item: 65, product: mockProducts[0] },
        ],
    },
    {
        order_id: 1039, customer_id: "4", fulfillment_id: 4,
        order_time: "2025-05-24T10:45:00Z", total_amount: 130,
        payment_method: "Cash", order_status: "Pending",
        customer: mockCustomers[3],
        fulfillment: { fulfillment_id: 4, fulfillment_type: "Pick_Up", pick_up: { fulfillment_id: 4, preferred_time: "12:00 PM" } },
        cart_items: [
        { order_id: 1039, product_id: 1, quantity: 2, price_per_item: 65, product: mockProducts[0] },
        ],
    },
];

export const mockWeeklySummary: WeeklySummary = {
    week_start: "2025-05-19",
    week_end: "2025-05-25",
    total_orders: 47,
    completed_orders: 40,
    total_revenue: 12460,
    orders_by_status: {
        Pending: 3,
        Confirmed: 2,
        Baking: 1,
        "Out for Delivery": 1,
        "For Pickup": 0,
        Completed: 40,
        Cancelled: 0,
    },
};

export const mockRiders: Rider[] = [
    { rider_id: 1, rider_name: "Rodel Bautista", rider_contact_num: "09171112222", current_location: "Katipunan" },
];

export const mockBomEntries: import("@/types/index").BOMEntry[] = [
    { bom_id: 1, product_id: 1, inventory_id: 1, quantity_required: 200, product: mockProducts[0], inventory: mockInventory[0] },
    { bom_id: 2, product_id: 1, inventory_id: 2, quantity_required: 100, product: mockProducts[0], inventory: mockInventory[1] },
    { bom_id: 3, product_id: 1, inventory_id: 3, quantity_required: 150, product: mockProducts[0], inventory: mockInventory[2] },
    { bom_id: 4, product_id: 2, inventory_id: 1, quantity_required: 180, product: mockProducts[1], inventory: mockInventory[0] },
    { bom_id: 5, product_id: 2, inventory_id: 2, quantity_required: 120, product: mockProducts[1], inventory: mockInventory[1] },
];