"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewForm({ slug, isAuthenticated }: { slug: string; isAuthenticated: boolean }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-gray-500">
        <a href="/login" className="text-brand-700 underline">
          Log in
        </a>{" "}
        to write a review.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (comment.trim().length < 5) {
      setError("Review must be at least 5 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/colleges/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? "Could not submit review.");
        return;
      }
      setComment("");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <label htmlFor="rating" className="text-sm text-gray-600">
          Rating
        </label>
        <select
          id="rating"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>
      <label htmlFor="comment" className="sr-only">
        Your review
      </label>
      <textarea
        id="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience..."
        rows={3}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
