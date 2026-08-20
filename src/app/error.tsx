"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
      <p className="text-sm text-red-600">Please try again. If the problem continues, check back later.</p>
      <button onClick={reset} className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
        Try again
      </button>
    </div>
  );
}
