export type Sentiment = "positive" | "neutral" | "negative";
export type QueryType = "discovery" | "brand_check" | "comparison";
export type IntentStatus = "visible" | "partial" | "invisible";

export type QueryResult = {
  model: string;
  /** For discovery and comparison questions: the brand was named. For brand checks: the model knew it. */
  mentioned: boolean;
  /** 1 = the first brand named in the answer. Null when not named. */
  position: number | null;
  /** A short verbatim passage from the answer. */
  excerpt: string;
  /** Other brands named in the answer, in order. */
  competitors: string[];
  /** The whole answer, when available. Sample reports only carry excerpts. */
  fullAnswer?: string;
};

export type Query = {
  id: number;
  type: QueryType;
  intent: string;
  text: string;
  results: QueryResult[];
};

export type Report = {
  id: string;
  brand: string;
  category: string;
  country: string;
  createdAt: string;
  score: number;
  verdict: string;
  stats: {
    mentionRate: number;
    avgPosition: number | null;
    sentiment: Sentiment;
  };
  models: { name: string; mentionRate: number }[];
  shareOfVoice: { name: string; mentions: number; isBrand: boolean }[];
  intents: { label: string; status: IntentStatus }[];
  queries: Query[];
  descriptors: string[];
  fixes: { title: string; why: string; action: string }[];
};

/** What the founder submits on the landing page. */
export type ReportInput = {
  brand: string;
  website: string;
  category: string;
  country: string;
  competitors: string[];
};

export type PipelineStep = "questions" | "asking" | "reading" | "scoring";

/** Progress events streamed while a report is being created. */
export type PipelineEvent =
  | { type: "step"; step: PipelineStep; status: "active" | "done" }
  | { type: "question"; id: number; queryType: QueryType; text: string }
  | { type: "progress"; step: PipelineStep; done: number; total: number }
  | { type: "done"; id: string; isSample: boolean }
  | { type: "error"; message: string };

export const MAX_COMPETITORS = 3;

/** Validates and tidies a submitted ReportInput. Shared so the form and the server agree. */
export function cleanInput(raw: unknown): { ok: true; input: ReportInput } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "Send a JSON object." };
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const brand = str(r.brand, 80);
  const category = str(r.category, 80);
  if (!brand) return { ok: false, error: "Brand name is required." };
  if (!category) return { ok: false, error: "Category is required." };
  const competitors = Array.isArray(r.competitors)
    ? [...new Set(r.competitors.map((c) => str(c, 60)).filter((c) => c && c.toLowerCase() !== brand.toLowerCase()))]
    : [];
  if (competitors.length > MAX_COMPETITORS) return { ok: false, error: `Up to ${MAX_COMPETITORS} competitors.` };
  return {
    ok: true,
    input: { brand, website: str(r.website, 200), category, country: str(r.country, 60) || "India", competitors },
  };
}
