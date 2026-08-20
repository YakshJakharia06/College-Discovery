import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const encoder = new TextEncoder();

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Add it to your .env file.");
  }
  return encoder.encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const SESSION_COOKIE = "session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

// The JWT's only job is to carry the user's id (as `sub`), signed so it can't
// be tampered with client-side. We never trust a client-supplied user id —
// this token is the ONLY source of truth for "who is making this request".
export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    // Expired, tampered, or malformed token — treat as "not authenticated".
    return null;
  }
}
