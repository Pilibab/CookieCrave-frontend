// ─── Customer ────────────────────────────────────────────────────────────────
export interface Customer {
    cust_id: string;
    cust_lastname: string;
    cust_firstname: string;
    cust_middlename?: string;
    cust_email: string;
    cust_cont_no?: string;
    cust_cd: string;
    cust_social_provider: "google";
}
