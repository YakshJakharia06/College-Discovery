// Client-side only helper for the Compare feature. Runs in the browser's
// localStorage — NOT sensitive data, just a small "which colleges is this
// visitor currently comparing" list, scoped to their own browser.

export type CompareEntry = { slug: string; name: string };

const KEY = "compareList";
const MAX = 3;

export function getCompareList(): CompareEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CompareEntry[]) : [];
  } catch {
    return [];
  }
}

export function addToCompare(entry: CompareEntry): { ok: boolean; message?: string } {
  const list = getCompareList();
  if (list.some((c) => c.slug === entry.slug)) {
    return { ok: false, message: "Already added to comparison." };
  }
  if (list.length >= MAX) {
    return { ok: false, message: `You can compare up to ${MAX} colleges.` };
  }
  window.localStorage.setItem(KEY, JSON.stringify([...list, entry]));
  return { ok: true };
}

export function removeFromCompare(slug: string): CompareEntry[] {
  const next = getCompareList().filter((c) => c.slug !== slug);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearCompare(): void {
  window.localStorage.removeItem(KEY);
}
