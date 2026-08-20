import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { predictorSchema } from "@/lib/validation";
import { apiSuccess, apiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const RESULT_SELECT = {
  name: true,
  slug: true,
  city: true,
  state: true,
  fees: true,
  rating: true,
  averagePackage: true,
  placementPercentage: true,
} satisfies Prisma.CollegeSelect;

/**
 * Rule-based tiering: lower rank -> higher-rated tier of colleges. This is a
 * simple, explainable, dataset-driven heuristic — NOT a real admission
 * predictor, which is why every response carries the disclaimer below.
 * Tune the thresholds here if your seeded dataset's rating spread changes.
 */
function getRankTier(rank: number): { minRating: number; label: string } {
  if (rank <= 5000) return { minRating: 4.6, label: "top-tier" };
  if (rank <= 20000) return { minRating: 4.2, label: "highly competitive" };
  if (rank <= 60000) return { minRating: 3.9, label: "competitive" };
  if (rank <= 150000) return { minRating: 3.6, label: "accessible" };
  return { minRating: 0, label: "broad-access" };
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`predictor:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return apiError("RATE_LIMITED", "Too many predictor requests. Please try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = predictorSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Invalid input.", 400);
  }
  const { exam, rank, location, budget, course } = parsed.data;
  const tier = getRankTier(rank);

  try {
    const and: Prisma.CollegeWhereInput[] = [{ rating: { gte: tier.minRating } }];
    if (location) {
      and.push({
        OR: [
          { state: { equals: location, mode: "insensitive" } },
          { city: { equals: location, mode: "insensitive" } },
        ],
      });
    }
    if (budget !== undefined) and.push({ fees: { lte: budget } });
    if (course) and.push({ courses: { some: { name: { contains: course, mode: "insensitive" } } } });

    let colleges = await prisma.college.findMany({
      where: { AND: and },
      orderBy: { rating: "desc" },
      take: 6,
      select: RESULT_SELECT,
    });

    // If the optional filters (location/budget/course) were too strict and
    // returned nothing, fall back to just the rank tier so the user still
    // gets useful results instead of an empty screen.
    let relaxed = false;
    if (colleges.length === 0 && and.length > 1) {
      relaxed = true;
      colleges = await prisma.college.findMany({
        where: { rating: { gte: tier.minRating } },
        orderBy: { rating: "desc" },
        take: 6,
        select: RESULT_SELECT,
      });
    }

    const recommendations = colleges.map((c) => ({
      ...c,
      reason: relaxed
        ? `Matches a "${tier.label}" profile for ${exam} rank ${rank.toLocaleString("en-IN")}. Your location/budget/course filters were relaxed because no colleges matched all criteria.`
        : `Matches a "${tier.label}" profile for ${exam} rank ${rank.toLocaleString("en-IN")}${location ? `, filtered to ${location}` : ""}${budget ? ", within your budget" : ""}${course ? `, offering ${course}` : ""}.`,
    }));

    return apiSuccess({
      recommendations,
      disclaimer:
        "These recommendations are estimates based on the available dataset and should not be considered official admission predictions.",
    });
  } catch {
    return apiError("INTERNAL_ERROR", "Could not generate recommendations right now.", 500);
  }
}
