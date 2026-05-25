// frontend/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("sb-access-token")?.value;
  const { pathname } = request.nextUrl;

  // Protect internal back-office routes
  const isInternalRoute = 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/inventory") || 
    pathname.startsWith("/orders") || 
    pathname.startsWith("/reports") || 
    pathname.startsWith("/admin");

  if (isInternalRoute && !token) {
    // No token? Boot them back to login
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

// Ensure middleware doesn't trigger on assets or the root route unnecessarily
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inventory/:path*",
    "/orders/:path*",
    "/reports/:path*",
    "/admin/:path*",
  ],
};