// frontend/src/app/page.tsx
import "./globals.css"; // 
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

async function checkUserRole(): Promise<{ isAdmin: boolean } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) {
    console.log("[NEXT_SERVER] No sb-access-token cookie detected yet.");
    return null;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BACKEND_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store", 
    });

    if (!response.ok) {
      console.log(`[NEXT_SERVER] Backend rejected token with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const isAdmin = data.is_admin === true || data.role === "admin";

    return { isAdmin };
  } catch (error) {
    console.error("[NEXT_SERVER] Backend connection failed:", error);
    return null;
  }
}

export default async function RootPage() {
  const session = await checkUserRole();

  // State 1: Anonymous public visitors
  if (!session) {
    return (
      <main className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-screen min-w-screen bg-(--navy)">
        <h1 className="text-[var(--warm-white)] text-4xl font-black mb-2">
          Welcome to CookieKrave 🍪
        </h1>
        <p className="text-gray-400 mb-6">Delicious creations are baking. Sign in to place your orders!</p>
        <a href="/auth/login" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
          Go to Sign In
        </a>
      </main>
    );
  }

  // State 2: Back-office management personnel
  if (session.isAdmin) {
    redirect("/dashboard");
  }

  // State 3: Logged in customer storefront experience
  return (
    // ! redirect to store 
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold">CookieKrave Storefront 🍪</h1>
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
          Customer Account Connected
        </span>
      </div>
      <div className="p-12 text-center bg-gray-900/50 rounded-xl border border-gray-800">
        <p className="text-gray-400">Our signature baking menu and product catalogs are spinning up!</p>
      </div>
    </main>
  );
}