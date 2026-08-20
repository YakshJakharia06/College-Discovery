import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

// [id] is actually the college's slug in every route in this folder — kept
// as [id] to match the folder naming in the assignment spec, but we never
// query by the internal cuid from a client-supplied value. Slugs are public,
// user-friendly, and not sequential/guessable in a way that leaks anything.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const college = await prisma.college.findUnique({
      where: { slug: params.id },
      include: {
        courses: { select: { id: true, name: true, duration: true, fees: true } },
        reviews: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: { select: { name: true } }, // never expose email/passwordHash of reviewers
          },
        },
      },
    });

    if (!college) {
      return apiError("NOT_FOUND", "College not found.", 404);
    }

    // Strip the internal database id before it ever reaches the client.
    const { id: _internalId, ...safeCollege } = college;
    return apiSuccess(safeCollege);
  } catch {
    return apiError("INTERNAL_ERROR", "Could not load this college right now.", 500);
  }
}
