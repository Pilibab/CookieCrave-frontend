// frontend/src/app/auth/callback-loading/page.tsx
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
    // Prevent React 18 strict mode from running this fetch twice simultaneously
    const hasRunPipeline = useRef(false);

    useEffect(() => {
        // 1. Listen for the token assignment from the URL hash fragment
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // We only care when a user successfully signs in via the OAuth handshake
            if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
                
                if (hasRunPipeline.current) return;
                hasRunPipeline.current = true;

                const token = session.access_token; 
                const user = session.user;

                // Structure the payload safely out of Google's metadata keys
                const automaticCustomerData = {
                CUST_NAME: user.user_metadata.full_name || user.user_metadata.name || "Google User",
                CUST_EMAIL: user.email,
                CUST_CONT_NO: user.phone || "Not Provided" 
                };

                // 2. Synchronize this data with your FastAPI backend
                try {
                // Double check your backend URL port (FastAPI defaults to http://127.0.0.1:8000)
                const response = await fetch("http://127.0.0.1:8000/customers", {
                    method: "POST",
                    headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                    },
                    body: JSON.stringify(automaticCustomerData)
                });

                if (response.ok) {
                    router.push("/dashboard");
                } else {
                    console.error("Backend validation failed tracking user registration.");
                    router.push("/auth/login");
                }
                } catch (err) {
                console.error("Network connectivity error connecting to FastAPI:", err);
                router.push("/auth/login");
                }
            } else if (event === "SIGNED_OUT") {
                // If the OAuth handshake failed entirely or missing keys
                router.push("/auth/login");
            }
            });

            // Clean up the auth subscription listener when this component unmounts
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