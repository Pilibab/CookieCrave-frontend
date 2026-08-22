// ─── Fulfillment ─────────────────────────────────────────────────────────────
export type FulfillmentType = "Delivery" | "Pick_Up";

export interface Fulfillment {
    fulfillment_id: number;
    fulfillment_type: FulfillmentType;
}

export interface Delivery {
    fulfillment_id: number;
    rider_id?: string;
    address: string;
    contact_name?: string;
    contact_number?: string;
    note?: string;
    floor_unit_num?: string;
}

export interface PickUp {
    fulfillment_id: number;
    preferred_time?: string;
    pick_up_location?: string;
}