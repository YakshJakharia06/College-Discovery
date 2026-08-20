import Link from "next/link";

type CollegeCardProps = {
  college: {
    slug: string;
    name: string;
    city: string;
    state: string;
    fees: number;
    rating: number;
    placementPercentage?: number;
  };
};

export default function CollegeCard({ college }: CollegeCardProps) {
  return (
    <Link
      href={`/colleges/${college.slug}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900">{college.name}</h3>
        <span className="shrink-0 rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
          ★ {college.rating.toFixed(1)}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {college.city}, {college.state}
      </p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-700">₹{college.fees.toLocaleString("en-IN")}/yr</span>
        {college.placementPercentage !== undefined && (
          <span className="text-gray-500">{college.placementPercentage}% placed</span>
        )}
      </div>
    </Link>
  );
}
