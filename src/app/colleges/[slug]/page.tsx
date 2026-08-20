import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/session";
import ReviewForm from "@/components/colleges/ReviewForm";
import SaveButton from "@/components/colleges/SaveButton";
import CompareButton from "@/components/compare/CompareButton";

export default async function CollegeDetailPage({ params }: { params: { slug: string } }) {
  const college = await prisma.college.findUnique({
    where: { slug: params.slug },
    include: {
      courses: { select: { id: true, name: true, duration: true, fees: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
      },
    },
  });

  if (!college) notFound();

  const userId = await getAuthUserId();
  let isSaved = false;
  if (userId) {
    const existing = await prisma.savedCollege.findUnique({
      where: { userId_collegeId: { userId, collegeId: college.id } },
    });
    isSaved = !!existing;
  }

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{college.name}</h1>
            <p className="text-gray-500">
              {college.city}, {college.state}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
              ★ {college.rating.toFixed(1)}
            </span>
            <SaveButton slug={college.slug} initialSaved={isSaved} isAuthenticated={!!userId} />
            <CompareButton slug={college.slug} name={college.name} />
          </div>
        </div>
        <p className="mt-4 text-gray-700">{college.description}</p>
        <p className="mt-4 text-lg font-semibold">{formatCurrency(college.fees)} / year</p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Courses</h2>
        {college.courses.length === 0 ? (
          <p className="text-sm text-gray-500">No course data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2 pr-4">Course</th>
                  <th className="py-2 pr-4">Duration</th>
                  <th className="py-2">Fees</th>
                </tr>
              </thead>
              <tbody>
                {college.courses.map((course) => (
                  <tr key={course.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4">{course.name}</td>
                    <td className="py-2 pr-4">{course.duration}</td>
                    <td className="py-2">{formatCurrency(course.fees)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Placements</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">Average package</p>
            <p className="text-lg font-semibold">{formatCurrency(college.averagePackage)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Highest package</p>
            <p className="text-lg font-semibold">{formatCurrency(college.highestPackage)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Placement rate</p>
            <p className="text-lg font-semibold">{college.placementPercentage}%</p>
          </div>
        </div>
        {college.topRecruiters.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-gray-500">Top recruiters</p>
            <div className="flex flex-wrap gap-2">
              {college.topRecruiters.map((r) => (
                <span key={r} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Reviews</h2>
        {college.reviews.length === 0 ? (
          <p className="mb-4 text-sm text-gray-500">No reviews yet. Be the first to review this college.</p>
        ) : (
          <ul className="mb-6 space-y-4">
            {college.reviews.map((r) => (
              <li key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.user.name}</span>
                  <span className="text-sm text-brand-700">★ {r.rating}</span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{r.comment}</p>
                <p className="mt-1 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
              </li>
            ))}
          </ul>
        )}
        <ReviewForm slug={college.slug} isAuthenticated={!!userId} />
      </section>
    </div>
  );
}
