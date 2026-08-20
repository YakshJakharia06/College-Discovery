import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CollegeCard from "@/components/colleges/CollegeCard";

export default async function HomePage() {
  const featured = await prisma.college.findMany({
    orderBy: { rating: "desc" },
    take: 3,
    select: { name: true, slug: true, city: true, state: true, fees: true, rating: true, placementPercentage: true },
  });

  return (
    <div className="space-y-12">
      <section className="rounded-xl bg-brand-600 px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">Find the right college for your future.</h1>
        <p className="mx-auto mt-3 max-w-xl text-brand-50">
          Search, compare, and get data-driven recommendations across colleges in India.
        </p>
        <form action="/colleges" className="mx-auto mt-6 flex max-w-md gap-2">
          <label htmlFor="home-search" className="sr-only">
            Search colleges
          </label>
          <input
            id="home-search"
            name="search"
            placeholder="Search by college name or city..."
            className="w-full rounded-md border-0 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-800 px-5 py-2 font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Search
          </button>
        </form>
        <div className="mt-6 flex justify-center gap-4 text-sm">
          <Link href="/predictor" className="underline hover:text-brand-100">
            Try the College Predictor
          </Link>
          <Link href="/compare" className="underline hover:text-brand-100">
            Compare Colleges
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Featured colleges</h2>
          <Link href="/colleges" className="text-sm text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-sm text-gray-500">No colleges available yet — run the seed script.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <CollegeCard key={c.slug} college={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
