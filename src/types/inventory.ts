// ─── Inventory ───────────────────────────────────────────────────────────────
// mytypes.ts
export type UnitType = "pcs" | "ml" | "g" | "kg" | "tray" | "L";
export interface InventoryItem {
    inv_id: number;
    inv_ing_name: string;
    inv_stock: number;
    inv_uom: UnitType;
    inv_rt: number;
}

export interface LowStockItem extends InventoryItem {
    is_low: boolean;
}