import { getAuthUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  // The user id comes ONLY from the verified session cookie — never from a
  // query param or request body. This is what prevents "/api/user?id=124"
  // style IDOR attacks: there is no id parameter to manipulate.
  const userId = await getAuthUserId();
  if (!userId) {
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true }, // never select passwordHash
  });

  if (!user) {
    // Token was valid but the user no longer exists (e.g. deleted account).
    return apiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  return apiSuccess(user);
}
