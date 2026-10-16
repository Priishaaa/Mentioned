import { useCallback, useState } from "react";

const key = (reportId: string) => `mentioned-fixes-done:${reportId}`;

function load(reportId: string): number[] {
  try {
    const raw = localStorage.getItem(key(reportId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

/** Which fixes the viewer has ticked off. Kept in this browser only; a convenience, not a record. */
export function useDoneFixes(reportId: string) {
  const [done, setDone] = useState<Set<number>>(() => new Set(load(reportId)));

  const toggle = useCallback(
    (index: number) =>
      setDone((prev) => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        try {
          localStorage.setItem(key(reportId), JSON.stringify([...next]));
        } catch {
          /* storage blocked: the tick still works for this visit */
        }
        return next;
      }),
    [reportId],
  );

  return { done, toggle };
}
