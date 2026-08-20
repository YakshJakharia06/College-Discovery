import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This middleware is UX-only: it redirects logged-out visitors away from
// /saved before the page even renders, so they're not shown a flash of a
// protected page. It does NOT perform real authorization — it only checks
// whether a "session" cookie exists, not whether it's valid.
//
// The actual security check happens server-side in every API route and
// Server Component via getAuthUserId(), which verifies the JWT signature.
// Never rely on this middleware alone for protection.

const PROTECTED_PATHS = ["/saved"];

export function middleware(request: NextRequest) {
  const isProtected = PROTECTED_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasSessionCookie = request.cookies.has("session");
  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/saved/:path*"],
};
