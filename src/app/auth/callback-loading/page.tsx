// callback-loading/page.tsx
"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '../../../lib/supabase'

export default function AuthCallbackLoading() {
    const router = useRouter();
    const hasRunPipeline = useRef(false);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
                
                if (hasRunPipeline.current) return;
                hasRunPipeline.current = true;

                const token = session.access_token; 

                try {
                    // Ping the backend /me endpoint. The backend checks if they are staff.
                    // If they aren't staff, the backend automatically registers them as a customer!
                    const response = await fetch("http://127.0.0.1:8000/api/auth/me", {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}` 
                        }
                    });

                    if (response.ok) {
                        // Save the token in a cookie so Next.js Server Components can read it
                        document.cookie = `sb-access-token=${token}; path=/; max-age=3600; SameSite=Lax; Secure`;
                        
                        // Push to Root (/) to evaluate whether to send them to /dashboard or storefront
                        router.push("/");
                    } else {
                        console.error("Backend failed credentials verification validation.");
                        router.push("/auth/login");
                    }
                } catch (err) {
                    console.error("Network connectivity error connecting to FastAPI auth backend:", err);
                    router.push("/auth/login");
                }
                
            } else if (event === "SIGNED_OUT") {
                router.push("/auth/login");
            }
        });

        return () => {
            subscription.unsubscribe();
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