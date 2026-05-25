// frontend/src/app/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

async function checkUserRole(): Promise<{ isAdmin: boolean } | null> {
  const cookieStore = await cookies();
  // Get the token saved during your authentication sync pipeline
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) return null;

  try {
    const response = await fetch("http://127.0.0.1:8000/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // Ensure Next.js doesn't aggressively cache this session call
      cache: "no-store", 
    });

    if (!response.ok) return null;

    const userData = await response.json();
    
    // Check your backend user metadata role condition here
    // e.g., checking if they belong to your '00_staff.sql' records
    const isAdmin = userData.role === "admin" || userData.is_staff === true;
    
    return { isAdmin };
  } catch (error) {
    console.error("Failed to verify user session with FastAPI backend:", error);
    return null;
  }
}

export default async function RootPage() {
  const session = await checkUserRole();

  // 1. If not logged in at all, let them view the public storefront/root home page
  if (!session) {
    // If you want a clean marketing/shop landing page, return its JSX component here.
    // Otherwise, redirect them to sign in:
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">Welcome to CookieKrave 🍪</h1>
        <p className="mt-2 text-gray-400">Delicious creations are baking. Sign in to place your orders!</p>
      </main>
    );
  }

  // 2. If logged in and verified as Admin/Staff -> Send to back-office metrics
  if (session.isAdmin) {
    redirect("/dashboard");
  }

  // 3. If logged in but just a standard Customer -> Send to public home storefront / customer landing
  redirect("/"); 
}