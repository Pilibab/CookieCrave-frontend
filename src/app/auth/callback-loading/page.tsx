// callback-loading/page.tsx
"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '../../../lib/supabase';
// Import your auth wrapper (adjust path if needed)
import { authApi } from '@/lib/api'; 

export default function AuthCallbackLoading() {
    const router = useRouter();
    const hasRunPipeline = useRef(false);

    useEffect(() => {
        // Give Supabase time to detect and exchange the hash token
        const { data: { subscription } } = supabase.auth.onAuthStateChange( async (event, session) => {

            if (event === "SIGNED_IN" && session) {
                if (hasRunPipeline.current) return;
                hasRunPipeline.current = true;

                const token = session.access_token;

                try {
                    // 1. IMPORTANT: Set the cookie FIRST! 
                    // Your authApi.me() wrapper relies on reading this cookie to attach the Bearer token.
                    document.cookie = `sb-access-token=${token}; path=/; max-age=3600; SameSite=Lax`;

                    // 2. Call your clean API wrapper (No manual fetch needed!)
                    const data = await authApi.me();
                    
                    // 3. Route dynamically based on the role the backend returned
                    if (data.user.role === "admin") {
                        console.log("Admin logged in, heading to dashboard");
                        router.push("/dashboard"); // Or wherever your admin home is
                    } else {
                        console.log("Customer logged in, heading to storefront");
                        router.push("/customer-ui");
                    }

                } catch (err) {
                    console.error("Auth pipeline failed:", err);
                    router.push("/auth/login");
                }

            } else if (event === "INITIAL_SESSION" && !session) {
                // No session at all even after init — bail out
                router.push("/auth/login");
            }
        });

        // Safety net — if nothing fires in 10 seconds, redirect
        const timeout = setTimeout(() => {
            if (!hasRunPipeline.current) {
                router.push("/auth/login");
            }
        }, 10000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, [router]);

    return (
        <div className="flex justify-center items-center h-screen bg-blue-950 text-white font-sans">
            <div className="text-center">
                <p className="text-lg font-medium mb-2">Verifying your credentials...</p>
                <p className="text-slate-400 text-sm">Synchronizing your secure CookieKrave Profile.</p>
            </div>
        </div>
    );
}