import type { IntentStatus, Query, QueryResult, Report, Sentiment } from "./types";

/*
 * Turns per-answer results into the report's numbers. Used by the server for real
 * reports and by the sample fixtures, so the two can never disagree.
 */

export function intentStatus(hits: number, total: number): IntentStatus {
  if (hits === 0) return "invisible";
  return hits / total >= 0.5 ? "visible" : "partial";
}

/** How much a mention is worth by where it appears. Named first counts most. */
export function positionWeight(position: number | null): number {
  if (position === 1) return 1;
  if (position === 2) return 0.8;
  if (position === 3) return 0.6;
  return 0.4;
}

/**
 * Visibility score, 0–100.
 * 85%: discovery answers (questions that don't name you), weighted by position.
 * 15%: brand checks where the model knew who you are.
 */
export function visibilityScore(queries: Query[]): number {
  const results = (type: Query["type"]) => queries.filter((q) => q.type === type).flatMap((q) => q.results);
  const discovery = results("discovery");
  const checks = results("brand_check");
  const discoveryPart = discovery.length
    ? discovery.reduce((sum, r) => sum + (r.mentioned ? positionWeight(r.position) : 0), 0) / discovery.length
    : 0;
  const knownPart = checks.length ? checks.filter((r) => r.mentioned).length / checks.length : 0;
  return Math.round(100 * (0.85 * discoveryPart + 0.15 * knownPart));
}

/** Overall tone: the most common sentiment among answers that named the brand. */
export function overallSentiment(perAnswer: Sentiment[]): Sentiment {
  if (!perAnswer.length) return "neutral";
  const counts = { positive: 0, neutral: 0, negative: 0 };
  for (const s of perAnswer) counts[s]++;
  if (counts.negative > counts.positive) return "negative";
  if (counts.positive > counts.negative && counts.positive >= counts.neutral) return "positive";
  return "neutral";
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");

/** True when two brand names refer to the same brand ("Crease & Co" = "crease and co"). */
export function sameBrand(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  return x.length > 0 && (x === y || (x.length > 3 && y.length > 3 && (x.startsWith(y) || y.startsWith(x))));
}

/**
 * The competitors to track: the ones the founder named, topped up with the brands
 * the AI models named most often in discovery answers.
 */
export function pickCompetitors(brand: string, given: string[], discovery: QueryResult[], max = 5): string[] {
  const picked = [...given];
  const counts = new Map<string, { name: string; n: number }>();
  for (const r of discovery)
    for (const name of r.competitors) {
      if (sameBrand(name, brand) || picked.some((p) => sameBrand(p, name))) continue;
      const key = norm(name);
      const entry = counts.get(key) ?? { name, n: 0 };
      entry.n++;
      counts.set(key, entry);
    }
  for (const { name } of [...counts.values()].sort((a, b) => b.n - a.n)) {
    if (picked.length >= max) break;
    picked.push(name);
  }
  return picked;
}

type Aggregates = Pick<Report, "models" | "shareOfVoice" | "intents"> & {
  mentionRate: number;
  avgPosition: number | null;
};

export function aggregate(brand: string, competitors: string[], queries: Query[]): Aggregates {
  const discovery = queries.filter((q) => q.type === "discovery");
  const results = discovery.flatMap((q) => q.results);
  const hits = results.filter((r) => r.mentioned);
  const modelNames = [...new Set(results.map((r) => r.model))];
  const positions = hits.map((r) => r.position).filter((p): p is number => p !== null);

  return {
    mentionRate: results.length ? hits.length / results.length : 0,
    avgPosition: positions.length ? positions.reduce((a, b) => a + b, 0) / positions.length : null,
    models: modelNames.map((name) => {
      const own = results.filter((r) => r.model === name);
      return { name, mentionRate: own.length ? own.filter((r) => r.mentioned).length / own.length : 0 };
    }),
    shareOfVoice: [
      { name: brand, mentions: hits.length, isBrand: true },
      ...competitors.map((name) => ({
        name,
        mentions: results.filter((r) => r.competitors.some((c) => sameBrand(c, name))).length,
        isBrand: false,
      })),
    ].sort((a, b) => b.mentions - a.mentions),
    intents: discovery.map((q) => ({
      label: q.intent,
      status: intentStatus(q.results.filter((r) => r.mentioned).length, q.results.length),
    })),
  };
}
