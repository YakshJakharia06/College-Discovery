import { SESSION_COOKIE } from "@/lib/auth";
import { apiSuccess } from "@/lib/api-response";

export async function POST() {
  const response = apiSuccess({ loggedOut: true });
  // Overwrite with an already-expired cookie — the standard, reliable way
  // to clear an HttpOnly cookie from a route handler.
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
