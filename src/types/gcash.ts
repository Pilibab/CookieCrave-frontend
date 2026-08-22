export interface GCashPayment {
    order_id: string;
    reference_no: string;
    amount: number;
    paid_at: Date;
}