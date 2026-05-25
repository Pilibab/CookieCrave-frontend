"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallbackLoading() {
    const router = useRouter();
    const hasRunPipeline = useRef(false);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
                
                if (hasRunPipeline.current) return;
                hasRunPipeline.current = true;

                const token = session.access_token; 
                const user = session.user;

                const automaticCustomerData = {
                    CUST_NAME: user.user_metadata.full_name || user.user_metadata.name || "Google User",
                    CUST_EMAIL: user.email,
                    CUST_CONT_NO: user.phone || "Not Provided" 
                };

                try {
                    const response = await fetch("http://127.0.0.1:8000/api/customers", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}` 
                        },
                        body: JSON.stringify(automaticCustomerData)
                    });

                    if (response.ok) {
                        // FIX 1: Save the token in a cookie so the Server Components can read it
                        document.cookie = `sb-access-token=${token}; path=/; max-age=3600; SameSite=Lax; Secure`;
                        
                        // FIX 2: Push to the Root Page ("/"). 
                        // The Root Page will hit `/me`, see if they are admin, and redirect accordingly!
                        router.push("/");
                    } else {
                        console.error("Backend validation failed tracking user registration.");
                        router.push("/auth/login");
                    }
                } catch (err) {
                    console.error("Network connectivity error connecting to FastAPI:", err);
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