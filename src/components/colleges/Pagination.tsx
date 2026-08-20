"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <button
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
        className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
        className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
