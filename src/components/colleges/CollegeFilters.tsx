"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

type Filters = {
  search?: string;
  state?: string;
  city?: string;
  minFee?: number;
  maxFee?: number;
  minRating?: number;
  sort?: string;
};

export default function CollegeFilters({ states, current }: { states: string[]; current: Filters }) {
  const router = useRouter();
  const pathname = usePathname();
  const [form, setForm] = useState<Filters>(current);

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function apply() {
    const params = new URLSearchParams();
    if (form.search) params.set("search", form.search);
    if (form.state) params.set("state", form.state);
    if (form.city) params.set("city", form.city);
    if (form.minFee !== undefined) params.set("minFee", String(form.minFee));
    if (form.maxFee !== undefined) params.set("maxFee", String(form.maxFee));
    if (form.minRating !== undefined) params.set("minRating", String(form.minRating));
    if (form.sort) params.set("sort", form.sort);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  function clear() {
    setForm({});
    router.push(pathname);
  }

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
      <input
        aria-label="Search colleges by name or city"
        placeholder="Search name or city"
        defaultValue={current.search ?? ""}
        onChange={(e) => update("search", e.target.value || undefined)}
        className="rounded border border-gray-300 px-3 py-2 text-sm lg:col-span-2"
      />
      <select
        aria-label="Filter by state"
        defaultValue={current.state ?? ""}
        onChange={(e) => update("state", e.target.value || undefined)}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">All states</option>
        {states.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        aria-label="Minimum fee"
        type="number"
        min={0}
        placeholder="Min fee"
        defaultValue={current.minFee ?? ""}
        onChange={(e) => update("minFee", e.target.value ? Number(e.target.value) : undefined)}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        aria-label="Maximum fee"
        type="number"
        min={0}
        placeholder="Max fee"
        defaultValue={current.maxFee ?? ""}
        onChange={(e) => update("maxFee", e.target.value ? Number(e.target.value) : undefined)}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <select
        aria-label="Minimum rating"
        defaultValue={current.minRating ?? ""}
        onChange={(e) => update("minRating", e.target.value ? Number(e.target.value) : undefined)}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Any rating</option>
        <option value="3">3+ stars</option>
        <option value="4">4+ stars</option>
        <option value="4.5">4.5+ stars</option>
      </select>
      <select
        aria-label="Sort colleges by"
        defaultValue={current.sort ?? "rating_desc"}
        onChange={(e) => update("sort", e.target.value)}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="rating_desc">Rating: High to low</option>
        <option value="fees_asc">Fees: Low to high</option>
        <option value="fees_desc">Fees: High to low</option>
        <option value="name_asc">Name: A-Z</option>
      </select>
      <div className="flex gap-2 lg:col-span-6">
        <button
          onClick={apply}
          className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Apply filters
        </button>
        <button
          onClick={clear}
          className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
