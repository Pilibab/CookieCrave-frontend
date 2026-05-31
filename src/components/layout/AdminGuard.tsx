"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { IS_MOCK } from "@/lib/api";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // In mock mode, auth is bypassed — admin is simulated
        if (IS_MOCK) return;
        if (!loading && user && !isAdmin) {
        router.replace("/auth/login?error=unauthorized");
        }
    }, [loading, user, isAdmin, router]);

    // Mock mode: skip all auth checks, render immediately
    if (IS_MOCK) return <>{children}</>;

    if (loading) {
        return (
        <div className="flex items-center justify-center h-screen bg-slate-100">
            <div className="w-7 h-7 border-4 border-slate-200 border-t-blue-950 rounded-full animate-spin" />
        </div>
        );
    }

    if (!isAdmin) return null;

    return <>{children}</>;
}