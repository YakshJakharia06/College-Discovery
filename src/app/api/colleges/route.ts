import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { collegesQuerySchema } from "@/lib/validation";
import { apiSuccess, apiError } from "@/lib/api-response";

const LIST_SELECT = {
  name: true,
  slug: true,
  city: true,
  state: true,
  fees: true,
  rating: true,
  averagePackage: true,
  highestPackage: true,
  placementPercentage: true,
  description: true,
} satisfies Prisma.CollegeSelect;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = collegesQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Invalid query parameters.", 400);
  }
  const q = parsed.data;

  try {
    // Used by the Compare page to fetch a specific, small set of colleges by
    // slug. Capped at 3 regardless of what's requested, matching the
    // "max 3 colleges to compare" rule.
    if (q.slugs) {
      const slugList = q.slugs.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
      const colleges = await prisma.college.findMany({
        where: { slug: { in: slugList } },
        select: LIST_SELECT,
      });
      return apiSuccess({ colleges });
    }

    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 12;

    const and: Prisma.CollegeWhereInput[] = [];
    if (q.search) {
      and.push({
        OR: [
          { name: { contains: q.search, mode: "insensitive" } },
          { city: { contains: q.search, mode: "insensitive" } },
        ],
      });
    }
    if (q.city) and.push({ city: { equals: q.city, mode: "insensitive" } });
    if (q.state) and.push({ state: { equals: q.state, mode: "insensitive" } });
    if (q.minFee !== undefined) and.push({ fees: { gte: q.minFee } });
    if (q.maxFee !== undefined) and.push({ fees: { lte: q.maxFee } });
    if (q.minRating !== undefined) and.push({ rating: { gte: q.minRating } });

    const where: Prisma.CollegeWhereInput = and.length > 0 ? { AND: and } : {};

    const orderBy: Prisma.CollegeOrderByWithRelationInput =
      q.sort === "fees_asc" ? { fees: "asc" } :
      q.sort === "fees_desc" ? { fees: "desc" } :
      q.sort === "rating_asc" ? { rating: "asc" } :
      q.sort === "name_asc" ? { name: "asc" } :
      { rating: "desc" };

    const [colleges, total] = await Promise.all([
      prisma.college.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: LIST_SELECT,
      }),
      prisma.college.count({ where }),
    ]);

    return apiSuccess({
      colleges,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    });
  } catch {
    // Never leak the raw database error to the client.
    return apiError("INTERNAL_ERROR", "Could not load colleges right now. Please try again.", 500);
  }
}
