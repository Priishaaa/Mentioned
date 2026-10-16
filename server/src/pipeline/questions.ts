import type { QueryType, ReportInput } from "@mentioned/shared";
import * as z from "zod/v4";
import { structured } from "../analysis";
import { questionsPrompt } from "../prompts";

const QuerySetSchema = z.object({
  queries: z.array(
    z.object({
      id: z.number(),
      type: z.enum(["discovery", "brand_check", "comparison"]),
      intent: z.string(),
      text: z.string(),
    }),
  ),
});

export type GeneratedQuery = { id: number; type: QueryType; intent: string; text: string };

const EXPECTED: Record<QueryType, number> = { discovery: 6, brand_check: 2, comparison: 2 };

/** Problems with a generated set. An empty list means it's usable. */
export function checkQuestions(input: ReportInput, queries: GeneratedQuery[]): string[] {
  const problems: string[] = [];
  for (const type of Object.keys(EXPECTED) as QueryType[]) {
    const n = queries.filter((q) => q.type === type).length;
    if (n !== EXPECTED[type]) problems.push(`expected ${EXPECTED[type]} ${type} questions, got ${n}`);
  }
  const names = [input.brand, ...input.competitors].map((n) => n.toLowerCase());
  for (const q of queries)
    if (q.type === "discovery" && names.some((n) => q.text.toLowerCase().includes(n)))
      problems.push(`discovery question ${q.id} names a brand`);
  return problems;
}

/** Claude writes the ten shopper questions. Retries if the mix is wrong. */
export async function generateQuestions(input: ReportInput, attempts = 3): Promise<GeneratedQuery[]> {
  let problems: string[] = [];
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const { queries } = await structured(QuerySetSchema, questionsPrompt(input));
    const ordered = queries.map((q, i) => ({ ...q, id: i + 1, intent: q.intent.trim().toLowerCase() }));
    problems = checkQuestions(input, ordered);
    if (!problems.length) return ordered;
  }
  throw new Error(`Couldn't write a valid question set: ${problems.join("; ")}`);
}
