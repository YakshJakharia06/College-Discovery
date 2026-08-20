import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, SESSION_COOKIE, SESSION_DURATION_SECONDS } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { apiSuccess, apiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit by IP to slow down automated account creation.
  const ip = getClientIp(request);
  const rl = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return apiError("RATE_LIMITED", "Too many registration attempts. Please try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Invalid input.", 400);
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiError("EMAIL_TAKEN", "An account with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });

  const token = await createSessionToken(user.id);
  // Only ever return safe fields — never passwordHash.
  const response = apiSuccess({ id: user.id, name: user.name, email: user.email }, 201);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, // JS on the page can never read this cookie — mitigates XSS token theft
    secure: process.env.NODE_ENV === "production", // HTTPS-only in production
    sameSite: "lax", // CSRF mitigation
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return response;
}
