"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCompareList, removeFromCompare, clearCompare, type CompareEntry } from "@/lib/compare-storage";

type CollegeData = {
  name: string;
  slug: string;
  city: string;
  state: string;
  fees: number;
  rating: number;
  averagePackage: number;
  highestPackage: number;
  placementPercentage: number;
};

export default function ComparePage() {
  const [entries, setEntries] = useState<CompareEntry[]>([]);
  const [colleges, setColleges] = useState<CollegeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEntries(getCompareList());
  }, []);

  useEffect(() => {
    if (entries.length === 0) {
      setColleges([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const slugs = entries.map((e) => e.slug).join(",");
    fetch(`/api/colleges?slugs=${encodeURIComponent(slugs)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError("Could not load comparison data.");
          return;
        }
        setColleges(data.data.colleges);
      })
      .catch(() => setError("Network error loading comparison."))
      .finally(() => setLoading(false));
  }, [entries]);

  function handleRemove(slug: string) {
    setEntries(removeFromCompare(slug));
  }

  function handleClear() {
    clearCompare();
    setEntries([]);
  }

  const rows: { label: string; render: (c: CollegeData) => string }[] = [
    { label: "Location", render: (c) => `${c.city}, ${c.state}` },
    { label: "Fees", render: (c) => `₹${c.fees.toLocaleString("en-IN")}` },
    { label: "Rating", render: (c) => `★ ${c.rating.toFixed(1)}` },
    { label: "Average package", render: (c) => `₹${c.averagePackage.toLocaleString("en-IN")}` },
    { label: "Highest package", render: (c) => `₹${c.highestPackage.toLocaleString("en-IN")}` },
    { label: "Placement %", render: (c) => `${c.placementPercentage}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compare colleges</h1>
        {entries.length > 0 && (
          <button onClick={handleClear} className="text-sm text-gray-500 underline hover:text-gray-700">
            Clear comparison
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
          No colleges added yet.{" "}
          <Link href="/colleges" className="text-brand-700 underline">
            Browse colleges
          </Link>{" "}
          and use the &quot;+ Compare&quot; button to add up to 3.
        </div>
      ) : loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
          Loading comparison...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : colleges.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
          Could not find the selected colleges. Try adding them again.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-4 text-gray-500">Category</th>
                {colleges.map((c) => (
                  <th key={c.slug} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/colleges/${c.slug}`} className="font-semibold text-brand-700 hover:underline">
                        {c.name}
                      </Link>
                      <button
                        onClick={() => handleRemove(c.slug)}
                        className="text-xs text-gray-400 hover:text-red-600"
                        aria-label={`Remove ${c.name} from comparison`}
                      >
                        remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-gray-100 last:border-0">
                  <td className="p-4 font-medium text-gray-600">{row.label}</td>
                  {colleges.map((c) => (
                    <td key={c.slug} className="p-4">
                      {row.render(c) || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
