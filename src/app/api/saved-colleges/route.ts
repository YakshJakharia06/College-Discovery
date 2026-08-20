import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/session";
import { savedCollegeSchema } from "@/lib/validation";
import { apiSuccess, apiError } from "@/lib/api-response";

// This file is the clearest example of the IDOR protection required by the
// spec: every query below is scoped with `userId` taken from the verified
// session, never from the request. There is no "/saved-colleges/:userId"
// route and no userId field accepted in any request body — so there is
// nothing for a client to tamper with to reach another user's saved list.

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return apiError("UNAUTHORIZED", "Authentication required.", 401);

  const saved = await prisma.savedCollege.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      college: { select: { name: true, slug: true, city: true, state: true, fees: true, rating: true } },
    },
  });

  return apiSuccess({ saved });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return apiError("UNAUTHORIZED", "Authentication required.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = savedCollegeSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Invalid input.", 400);
  }

  const college = await prisma.college.findUnique({ where: { slug: parsed.data.slug } });
  if (!college) return apiError("NOT_FOUND", "College not found.", 404);

  // upsert on the (userId, collegeId) unique constraint — the database
  // itself guarantees no duplicate saves, not just a frontend check.
  await prisma.savedCollege.upsert({
    where: { userId_collegeId: { userId, collegeId: college.id } },
    update: {},
    create: { userId, collegeId: college.id },
  });

  return apiSuccess({ slug: college.slug, saved: true }, 201);
}

export async function DELETE(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return apiError("UNAUTHORIZED", "Authentication required.", 401);

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return apiError("VALIDATION_ERROR", "A slug query parameter is required.", 400);

  const college = await prisma.college.findUnique({ where: { slug } });
  if (!college) return apiError("NOT_FOUND", "College not found.", 404);

  // deleteMany (not delete-by-id) scoped to BOTH userId and collegeId — this
  // is what makes it impossible to delete another user's saved-college row
  // even if someone guessed its underlying id.
  await prisma.savedCollege.deleteMany({ where: { userId, collegeId: college.id } });

  return apiSuccess({ slug, saved: false });
}
