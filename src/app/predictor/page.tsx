"use client";

import { useState } from "react";
import Link from "next/link";

type Recommendation = {
  name: string;
  slug: string;
  city: string;
  state: string;
  fees: number;
  rating: number;
  averagePackage: number;
  placementPercentage: number;
  reason: string;
};

const EXAMS = ["JEE Main", "JEE Advanced", "BITSAT", "VITEEE", "State CET"];

export default function PredictorPage() {
  const [exam, setExam] = useState(EXAMS[0]);
  const [rank, setRank] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [course, setCourse] = useState("");
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const rankNum = Number(rank);
    if (!rank || !Number.isFinite(rankNum) || rankNum <= 0) {
      setError("Please enter a valid rank.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/predictor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam,
          rank: rankNum,
          location: location || undefined,
          budget: budget ? Number(budget) : undefined,
          course: course || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? "Could not generate recommendations.");
        return;
      }
      setResults(data.data.recommendations);
      setDisclaimer(data.data.disclaimer);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">College predictor</h1>
        <p className="text-sm text-gray-500">Enter your exam and rank to get a shortlist of colleges.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-6 sm:grid-cols-2"
      >
        <div>
          <label htmlFor="exam" className="mb-1 block text-sm text-gray-600">
            Entrance exam
          </label>
          <select
            id="exam"
            value={exam}
            onChange={(e) => setExam(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {EXAMS.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rank" className="mb-1 block text-sm text-gray-600">
            Rank
          </label>
          <input
            id="rank"
            type="number"
            min={1}
            required
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. 15000"
          />
        </div>
        <div>
          <label htmlFor="location" className="mb-1 block text-sm text-gray-600">
            Preferred location (optional)
          </label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. Maharashtra"
          />
        </div>
        <div>
          <label htmlFor="budget" className="mb-1 block text-sm text-gray-600">
            Budget per year (optional)
          </label>
          <input
            id="budget"
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. 300000"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="course" className="mb-1 block text-sm text-gray-600">
            Preferred course (optional)
          </label>
          <input
            id="course"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. Computer Science"
          />
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Predicting..." : "Get recommendations"}
          </button>
        </div>
      </form>

      {results && (
        <div className="space-y-4">
          {disclaimer && (
            <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{disclaimer}</p>
          )}
          {results.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
              No matching colleges found. Try adjusting your location, budget, or course.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {results.map((r) => (
                <div key={r.slug} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <Link href={`/colleges/${r.slug}`} className="font-semibold text-brand-700 hover:underline">
                      {r.name}
                    </Link>
                    <span className="text-sm text-brand-700">★ {r.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {r.city}, {r.state}
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    ₹{r.fees.toLocaleString("en-IN")}/yr · {r.placementPercentage}% placed
                  </p>
                  <p className="mt-2 text-xs text-gray-500">{r.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
