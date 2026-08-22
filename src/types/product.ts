// ─── Product ─────────────────────────────────────────────────────────────────
export interface Product {
    prod_id: number;
    prod_name: string;
    prod_desc?: string;
    prod_price: number;
    prod_available: boolean;
    prod_sl: string;
    prod_image_url: string;
}
