// frontend/src/hooks/useAuth.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import type { User, UserRole } from "@/types";

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    // Has access to admin panel, but might have limited operation 
    isStaff: boolean;                               
    hasRole: (roles: UserRole[]) => boolean;
    can: (permission: string) => boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    isAdmin: false,
    // can access admin panel but methods may be restricited 
    isStaff: false,
    hasRole: () => false,
    can: () => false,             
    logout: async () => {},
});

// Helper function to read the token cookie on the client side
function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Grab the token cookie written 
        const token = getCookie("sb-access-token");

        // Stop loading immediately and do NOT call the backend.
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        // 3. Token exists! Safe to verify the profile details with FastAPI
        authApi
            .me()
            .then(({ user }) => setUser(user))
            .catch(() => {
                // If the backend says the token is expired/invalid, clear it out
                document.cookie =
                    "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    // derive access right "adminity" FFF
    const isAdmin = user?.role === "admin";

    // staff or higher can view dashboard
    // only roles higher than staff can edit the tables 
    const isStaff = ["admin", "staff"].includes(user?.role || "");

    const hasRole = (roles: UserRole[]) => {
        return user ? roles.includes(user.role) : false;
    }

    const can = (permission: string) => {
        if (isAdmin) return true; // Admins override all checks
        return user?.permissions?.includes(permission) ?? false;
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (err) {
            console.error("Logout request error:", err);
        } finally {
            // Always clear the local session cookie on logout
            document.cookie =
                "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            setUser(null);
            window.location.href = "/auth/login";
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, isStaff, hasRole, can, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
