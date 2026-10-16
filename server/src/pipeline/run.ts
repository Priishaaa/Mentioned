import {
  aggregate,
  overallSentiment,
  pickCompetitors,
  visibilityScore,
  type Query,
  type Report,
  type ReportInput,
  type Sentiment,
} from "@mentioned/shared";
import { config } from "../config";
import { suggestedDelayMs } from "../retry";
import type { Provider } from "../providers";
import { emit, saveReport, type Job } from "../store";
import { generateQuestions } from "./questions";
import { readAnswers, type Reading } from "./read";
import { summarize } from "./summarize";

/** Runs tasks with at most `limit` in flight. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** A failure explained for the person running the check. The raw error goes to the server log. */
export function friendlyError(e: unknown): string {
  const raw = errorMessage(e);
  const status = (e as { status?: unknown } | null)?.status;
  if (status === 401 || status === 403 || /API key not valid|API_KEY_INVALID|invalid x-api-key|Incorrect API key|Bad credentials|Unauthorized/i.test(raw))
    return "An API key was rejected. Check the keys in the .env file, then restart the server.";
  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw)) {
    const wait = suggestedDelayMs(e);
    if (wait && wait > 60 * 60_000)
      return `The free daily limit for the AI model has been used up. It resets in about ${Math.round(wait / 3_600_000)} hours; try again then.`;
    return "The free-tier limit has been reached for now. Wait a few minutes and try again.";
  }
  try {
    const inner = (JSON.parse(raw) as { error?: { message?: string } }).error?.message;
    if (inner) return inner;
  } catch {
    // not JSON: use as is
  }
  return raw;
}

/** The Claude-backed steps. Tests swap these for fakes. */
export const defaultSteps = { generateQuestions, readAnswers, summarize, saveReport };
export type Steps = typeof defaultSteps;

/** The full check: write questions, ask every model, read every answer, score, summarise. */
export async function runCheck(job: Job, input: ReportInput, providers: Provider[], steps: Steps = defaultSteps): Promise<void> {
  const { generateQuestions, readAnswers, summarize, saveReport } = steps;
  try {
    // 1. Questions
    emit(job, { type: "step", step: "questions", status: "active" });
    const questions = await generateQuestions(input);
    for (const q of questions) emit(job, { type: "question", id: q.id, queryType: q.type, text: q.text });
    emit(job, { type: "step", step: "questions", status: "done" });

    // 2. Ask every model every question
    const calls = questions.flatMap((q) => providers.map((p) => ({ q, p })));
    let asked = 0;
    emit(job, { type: "step", step: "asking", status: "active" });
    const answers = await mapLimit(calls, config.concurrency, async ({ q, p }) => {
      try {
        const { text, refused } = await p.ask(q.text);
        return { q, model: p.name, text, ok: !refused && text.trim().length > 0 };
      } catch (e) {
        console.warn(`[${job.id}] ${p.name} failed on q${q.id}: ${errorMessage(e)}`);
        return { q, model: p.name, text: "", ok: false };
      } finally {
        emit(job, { type: "progress", step: "asking", done: ++asked, total: calls.length });
      }
    });
    emit(job, { type: "step", step: "asking", status: "done" });
    const usable = answers.filter((a) => a.ok);
    if (usable.length === 0) throw new Error("None of the AI models returned an answer.");

    // 3. Read every answer, a batch per analysis call
    let read = 0;
    emit(job, { type: "step", step: "reading", status: "active" });
    const batches: (typeof usable)[] = [];
    for (let i = 0; i < usable.length; i += config.readBatch) batches.push(usable.slice(i, i + config.readBatch));
    const ctx = { brand: input.brand, website: input.website, category: input.category };
    const readings = (
      await mapLimit(batches, config.concurrency, async (batch) => {
        let results: (Reading | null)[];
        try {
          results = await readAnswers(
            batch.map((a) => ({ queryType: a.q.type, question: a.q.text, model: a.model, answer: a.text })),
            ctx,
          );
        } catch (e) {
          console.warn(`[${job.id}] couldn't read a batch of ${batch.length} answers: ${errorMessage(e)}`);
          results = batch.map(() => null);
        }
        read += batch.length;
        emit(job, { type: "progress", step: "reading", done: read, total: usable.length });
        return batch.map((a, i) => ({ a, reading: results[i] }));
      })
    ).flat();
    emit(job, { type: "step", step: "reading", status: "done" });
    if (!readings.some((r) => r.reading)) throw new Error("Couldn't read any of the answers.");

    // 4. Score and summarise
    emit(job, { type: "step", step: "scoring", status: "active" });
    const queries: Query[] = questions.map((q) => ({
      ...q,
      results: readings.flatMap(({ a, reading }) => (a.q.id === q.id && reading ? [reading.result] : [])),
    }));
    const valid = readings.flatMap(({ reading }) => (reading ? [reading] : []));
    const discoveryResults = queries.filter((q) => q.type === "discovery").flatMap((q) => q.results);
    const competitors = pickCompetitors(input.brand, input.competitors, discoveryResults);
    const { mentionRate, avgPosition, ...aggregates } = aggregate(input.brand, competitors, queries);
    const sentiments: Sentiment[] = valid.filter((r) => r.result.mentioned).map((r) => r.sentiment);

    const draft: Omit<Report, "verdict" | "fixes"> = {
      id: job.id,
      brand: input.brand,
      category: input.category,
      country: input.country,
      createdAt: new Date().toISOString(),
      score: visibilityScore(queries),
      stats: { mentionRate, avgPosition, sentiment: overallSentiment(sentiments) },
      ...aggregates,
      queries,
      descriptors: [...new Map(valid.flatMap((r) => r.descriptors).map((d) => [d.toLowerCase(), d])).values()].slice(0, 5),
    };
    const report: Report = { ...draft, ...(await summarize(draft)) };
    await saveReport(report);
    emit(job, { type: "step", step: "scoring", status: "done" });
    emit(job, { type: "done", id: report.id, isSample: false });
  } catch (e) {
    console.error(`[${job.id}] check failed:`, e);
    emit(job, { type: "error", message: friendlyError(e) });
  }
}
