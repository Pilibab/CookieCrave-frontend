import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/auth/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  // The backend sets a session cookie — check for its presence
  const hasSession = request.cookies.has("connect.sid") || request.cookies.has("session");

  if (!isPublic && !hasSession) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (isPublic && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
