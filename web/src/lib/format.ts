import type { QueryType } from "@mentioned/shared";

export const pct = (rate: number) => `${Math.round(rate * 100)}%`;

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export const QUERY_TYPE_LABEL: Record<QueryType, string> = {
  discovery: "Discovery",
  brand_check: "Brand check",
  comparison: "Comparison",
};

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Score bands used for the scale under the hero number. */
export const SCORE_BANDS = [
  { from: 0, to: 25, label: "Rarely seen" },
  { from: 25, to: 50, label: "Sometimes seen" },
  { from: 50, to: 75, label: "Often recommended" },
  { from: 75, to: 101, label: "Top of mind" },
] as const;

export const bandFor = (score: number) => SCORE_BANDS.find((b) => score >= b.from && score < b.to)!;

export const pad2 = (n: number) => String(n).padStart(2, "0");
