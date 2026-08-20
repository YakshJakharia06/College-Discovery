"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SaveButton({
  slug,
  initialSaved,
  isAuthenticated,
}: {
  slug: string;
  initialSaved: boolean;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      if (saved) {
        await fetch(`/api/saved-colleges?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
        setSaved(false);
      } else {
        await fetch("/api/saved-colleges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        setSaved(true);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded border px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
        saved ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {loading ? "..." : saved ? "Saved" : "Save"}
    </button>
  );
}
