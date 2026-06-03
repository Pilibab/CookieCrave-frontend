// frontend/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/callback-loading",  // ← add this
];

export function middleware(request: NextRequest) {
  // Correctly uses your Supabase access token cookie
  const token = request.cookies.get("sb-access-token")?.value;
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const hasSession = !!token; 

  // 1. Protect internal back-office routes (From Your HEAD branch)
  const isInternalRoute = 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/inventory") || 
    pathname.startsWith("/orders") || 
    pathname.startsWith("/reports") || 
    pathname.startsWith("/admin");

  if (isInternalRoute && !hasSession) {
    // No token? Boot them back to login
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 2. If logged in, don't let them visit public auth pages (From MainPanel)
  if (isPublic && hasSession) {
    // return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Global matcher from MainPanel to safely bypass static assets and customer facing UI
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|home-customer|customer-ui|images).*)"],
};