// ─── BOM ─────────────────────────────────────────────────────────────────────
export interface BOMEntry {
    bom_id: number;
    prod_id: number;
    inv_id: number;
    bom_quan_req: number;
}
export interface BOMBulkCreate {
    prod_id: number;
    ingredients: { inv_id: number; bom_quan_req: number }[];
}