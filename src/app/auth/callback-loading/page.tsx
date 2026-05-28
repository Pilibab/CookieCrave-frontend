// callback-loading/page.tsx
"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '../../../lib/supabase'

export default function AuthCallbackLoading() {
    const router = useRouter();
    const hasRunPipeline = useRef(false);

    useEffect(() => {
        console.log("Full URL:", window.location.href);
        console.log("Hash:", window.location.hash);
        console.log("Search:", window.location.search);
        // Give Supabase time to detect and exchange the hash token
        const { data: { subscription } } = supabase.auth.onAuthStateChange( async (event, session) => {
            console.log("Auth event:", event, session); // debug

            if (event === "SIGNED_IN" && session) {
                if (hasRunPipeline.current) return;
                hasRunPipeline.current = true;

                const token = session.access_token;

                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BACKEND_URL}/api/auth/me`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        }
                    });
                    console.log(response);
                    
                    if (response.ok) {
                        document.cookie = `sb-access-token=${token}; path=/; max-age=3600; SameSite=Lax`;
                        console.log("response ok, proceeding");
                        router.push("/");
                    } else {
                        console.error("Backend rejected:", await response.text());
                        router.push("/auth/login");
                    }
                } catch (err) {
                    console.error("Network error:", err);
                    router.push("/auth/login");
                }

            } else if (event === "INITIAL_SESSION" && !session) {
                // No session at all even after init — bail out
                router.push("/auth/login");
            }
            console.log("Auth event:", event, session); // debug

        });

        // Safety net — if nothing fires in 10 seconds, redirect
        const timeout = setTimeout(() => {
            if (!hasRunPipeline.current) {
                console.error("Auth timeout — no session detected.");
                router.push("/auth/login");
            }
        }, 10000);

        
        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, [router]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0d1240", color: "#fff", fontFamily: "sans-serif" }}>
            <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Verifying your credentials...</p>
                <p style={{ color: "#6b6f8a", fontSize: 14 }}>Synchronizing your secure CookieKrave Profile.</p>
            </div>
        </div>
    );
}