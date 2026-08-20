import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, SESSION_COOKIE, SESSION_DURATION_SECONDS } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { apiSuccess, apiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`login:${ip}`, 8, 15 * 60 * 1000);
  if (!rl.allowed) {
    return apiError("RATE_LIMITED", "Too many login attempts. Please try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Invalid input.", 400);
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Deliberately identical error for "no such user" and "wrong password" —
  // this avoids leaking which emails are registered (a common enumeration
  // vulnerability).
  if (!user) {
    return apiError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }
  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return apiError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }

  const token = await createSessionToken(user.id);
  const response = apiSuccess({ id: user.id, name: user.name, email: user.email });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return response;
}
