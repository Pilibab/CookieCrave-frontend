// ─── Staff ────────────────────────────────────────────────────────────────
export interface Staff {
    staff_id: string;
    staff_name: string;
    staff_email: string;
    role: "admin" | "manager" | "baker";
}