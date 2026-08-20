"use client";

import { useState } from "react";
import { addToCompare } from "@/lib/compare-storage";

export default function CompareButton({ slug, name }: { slug: string; name: string }) {
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    const result = addToCompare({ slug, name });
    setMessage(result.ok ? "Added to comparison." : result.message ?? "Could not add.");
    setTimeout(() => setMessage(null), 2500);
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        + Compare
      </button>
      {message && (
        <span className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white">
          {message}
        </span>
      )}
    </div>
  );
}
