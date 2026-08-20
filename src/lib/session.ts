import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "./auth";

/**
 * Reads the authenticated user's id from the server-side session cookie.
 * This is the ONLY way any API route or Server Component should determine
 * "who is asking" — never from a URL param, query string, or request body.
 */
export async function getAuthUserId(): Promise<string | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
