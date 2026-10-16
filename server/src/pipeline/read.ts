import { sameBrand, type QueryResult, type QueryType, type Sentiment } from "@mentioned/shared";
import * as z from "zod/v4";
import { structured } from "../analysis";
import { readAnswersPrompt } from "../prompts";

const ReadingSchema = z.object({
  answer_id: z.number(),
  brands: z.array(z.string()),
  brand_named: z.boolean(),
  brand_known: z.boolean(),
  descriptors: z.array(z.string()),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  excerpt: z.string(),
});
const BatchSchema = z.object({ readings: z.array(ReadingSchema) });
type RawReading = z.infer<typeof ReadingSchema>;

export type AnswerToRead = {
  queryType: QueryType;
  question: string;
  model: string;
  answer: string;
};

export type Reading = {
  result: QueryResult;
  descriptors: string[];
  sentiment: Sentiment;
};

const squash = (s: string) => s.replace(/\s+/g, " ").trim();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const namedIn = (text: string, brand: string) => new RegExp(`(?<!\\w)${escape(brand)}(?!\\w)`, "i").test(text);

/** Fallback excerpt when the model's "verbatim" quote isn't actually in the answer. */
export function fallbackExcerpt(answer: string, brand: string): string {
  const text = squash(answer.replace(/[#*_>`]/g, ""));
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  const hit = sentences.findIndex((s) => namedIn(s, brand));
  const start = hit >= 0 ? hit : 0;
  const excerpt = sentences.slice(start, start + 2).join("").trim();
  return excerpt.length > 320 ? `${excerpt.slice(0, 317).trimEnd()}…` : excerpt;
}

/** Turns the model's reading of one answer into a result, cross-checked against the text. */
export function interpret(raw: RawReading, a: AnswerToRead, brand: string): Reading {
  // Trust a plain text match over the model's judgement if they disagree.
  const named = raw.brand_named || namedIn(a.answer, brand);
  // For brand checks, "mentioned" means the model actually knew the brand.
  const mentioned = a.queryType === "brand_check" ? named && raw.brand_known : named;
  const index = raw.brands.findIndex((b) => sameBrand(b, brand));
  const text = squash(a.answer);
  const excerpt = raw.excerpt.trim() && text.includes(squash(raw.excerpt)) ? squash(raw.excerpt) : fallbackExcerpt(a.answer, brand);

  return {
    result: {
      model: a.model,
      mentioned,
      position: mentioned ? (index >= 0 ? index + 1 : null) : null,
      excerpt,
      competitors: raw.brands.filter((b) => !sameBrand(b, brand)).slice(0, 8),
      fullAnswer: a.answer,
    },
    // Keep only phrases that really appear in the answer.
    descriptors: mentioned ? raw.descriptors.map(squash).filter((d) => d && text.toLowerCase().includes(d.toLowerCase())) : [],
    sentiment: named ? raw.sentiment : "neutral",
  };
}

/**
 * Reads a batch of answers in one analysis call. Returns one entry per answer, in
 * order; null where the model skipped an answer.
 */
export async function readAnswers(
  answers: AnswerToRead[],
  ctx: { brand: string; website: string; category: string },
): Promise<(Reading | null)[]> {
  const { readings } = await structured(
    BatchSchema,
    readAnswersPrompt({ ...ctx, answers: answers.map((a, i) => ({ id: i + 1, ...a })) }),
    { effort: "low" },
  );
  const byId = new Map(readings.map((r) => [r.answer_id, r]));
  return answers.map((a, i) => {
    const raw = byId.get(i + 1);
    return raw ? interpret(raw, a, ctx.brand) : null;
  });
}
