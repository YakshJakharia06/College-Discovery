import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import CollegeCard from "@/components/colleges/CollegeCard";
import CollegeFilters from "@/components/colleges/CollegeFilters";
import Pagination from "@/components/colleges/Pagination";

type SearchParams = { [key: string]: string | string[] | undefined };

function toStr(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function toNum(v: string | string[] | undefined): number | undefined {
  const s = toStr(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

const PAGE_SIZE = 9;

export default async function CollegesPage({ searchParams }: { searchParams: SearchParams }) {
  const search = toStr(searchParams.search);
  const state = toStr(searchParams.state);
  const city = toStr(searchParams.city);
  const minFee = toNum(searchParams.minFee);
  const maxFee = toNum(searchParams.maxFee);
  const minRating = toNum(searchParams.minRating);
  const sort = toStr(searchParams.sort) ?? "rating_desc";
  const page = Math.max(1, toNum(searchParams.page) ?? 1);

  const and: Prisma.CollegeWhereInput[] = [];
  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  if (state) and.push({ state: { equals: state, mode: "insensitive" } });
  if (city) and.push({ city: { equals: city, mode: "insensitive" } });
  if (minFee !== undefined) and.push({ fees: { gte: minFee } });
  if (maxFee !== undefined) and.push({ fees: { lte: maxFee } });
  if (minRating !== undefined) and.push({ rating: { gte: minRating } });
  const where: Prisma.CollegeWhereInput = and.length > 0 ? { AND: and } : {};

  const orderBy: Prisma.CollegeOrderByWithRelationInput =
    sort === "fees_asc" ? { fees: "asc" } :
    sort === "fees_desc" ? { fees: "desc" } :
    sort === "rating_asc" ? { rating: "asc" } :
    sort === "name_asc" ? { name: "asc" } :
    { rating: "desc" };

  let colleges: { name: string; slug: string; city: string; state: string; fees: number; rating: number; placementPercentage: number }[] = [];
  let total = 0;
  let loadError = false;

  try {
    [colleges, total] = await Promise.all([
      prisma.college.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: { name: true, slug: true, city: true, state: true, fees: true, rating: true, placementPercentage: true },
      }),
      prisma.college.count({ where }),
    ]);
  } catch {
    loadError = true;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statesResult = await prisma.college
    .findMany({ distinct: ["state"], select: { state: true }, orderBy: { state: "asc" } })
    .catch(() => [] as { state: string }[]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Explore colleges</h1>
        <p className="text-sm text-gray-500">
          {loadError ? "Search and filter colleges across India." : `Search and filter ${total} colleges across India.`}
        </p>
      </div>

      <CollegeFilters
        states={statesResult.map((s) => s.state)}
        current={{ search, state, city, minFee, maxFee, minRating, sort }}
      />

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          Something went wrong loading colleges. Please try again in a moment.
        </div>
      ) : colleges.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
          No colleges match your filters. Try clearing some filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colleges.map((c) => (
              <CollegeCard key={c.slug} college={c} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
