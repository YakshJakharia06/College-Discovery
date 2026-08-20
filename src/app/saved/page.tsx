import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function SavedPage() {
  // Real, server-side authorization: if there's no valid session, redirect.
  // The middleware also does a cosmetic check, but this is the check that
  // actually matters.
  const userId = await getAuthUserId();
  if (!userId) redirect("/login?redirectTo=/saved");

  // Scoped strictly to the authenticated user's id — this is the only
  // query that ever runs here, so there is no way to view anyone else's
  // saved colleges via this page.
  const saved = await prisma.savedCollege.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      college: { select: { name: true, slug: true, city: true, state: true, fees: true, rating: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your saved colleges</h1>
      {saved.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
          You haven&apos;t saved any colleges yet.{" "}
          <Link href="/colleges" className="text-brand-700 underline">
            Browse colleges
          </Link>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((s) => (
            <Link
              key={s.college.slug}
              href={`/colleges/${s.college.slug}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md"
            >
              <h3 className="font-semibold">{s.college.name}</h3>
              <p className="text-sm text-gray-500">
                {s.college.city}, {s.college.state}
              </p>
              <p className="mt-2 text-sm text-gray-700">
                ₹{s.college.fees.toLocaleString("en-IN")}/yr · ★ {s.college.rating.toFixed(1)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
