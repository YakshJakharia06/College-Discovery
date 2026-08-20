import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/session";
import { reviewSchema } from "@/lib/validation";
import { apiSuccess, apiError } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const college = await prisma.college.findUnique({ where: { slug: params.id }, select: { id: true } });
  if (!college) return apiError("NOT_FOUND", "College not found.", 404);

  const reviews = await prisma.review.findMany({
    where: { collegeId: college.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
  });
  return apiSuccess({ reviews });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // The reviewer is always the authenticated session's user — never a
  // userId taken from the request body. This is the core IDOR protection:
  // there is simply no field a client can send to post as someone else.
  const userId = await getAuthUserId();
  if (!userId) {
    return apiError("UNAUTHORIZED", "You must be logged in to write a review.", 401);
  }

  const rl = rateLimit(`review:${userId}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return apiError("RATE_LIMITED", "You're submitting reviews too quickly. Please try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Invalid input.", 400);
  }

  const college = await prisma.college.findUnique({ where: { slug: params.id } });
  if (!college) {
    return apiError("NOT_FOUND", "College not found.", 404);
  }

  try {
    // Create the review and recompute the college's denormalized average
    // rating in a single transaction, so the two never fall out of sync.
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          collegeId: college.id,
          userId,
          rating: parsed.data.rating,
          comment: parsed.data.comment,
        },
      });

      const agg = await tx.review.aggregate({
        where: { collegeId: college.id },
        _avg: { rating: true },
      });

      await tx.college.update({
        where: { id: college.id },
        data: { rating: agg._avg.rating ?? 0 },
      });

      return created;
    });

    return apiSuccess(
      { id: review.id, rating: review.rating, comment: review.comment, createdAt: review.createdAt },
      201
    );
  } catch {
    return apiError("INTERNAL_ERROR", "Could not submit your review right now.", 500);
  }
}
