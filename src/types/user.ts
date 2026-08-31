// types/auth.ts
export type UserRole = "admin" | "staff" | "customer";

export interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    role: UserRole;
    permissions?: string[]; // e.g. ["read:orders", "write:products"]
}
    