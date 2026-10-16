import assert from "node:assert/strict";
import { test } from "node:test";
import type { PipelineEvent, Report, ReportInput } from "@mentioned/shared";
import type { Provider } from "./providers";
import { interpret } from "./pipeline/read";
import { runCheck, type Steps } from "./pipeline/run";
import type { GeneratedQuery } from "./pipeline/questions";
import { createJob } from "./store";

/*
 * Runs the real orchestration (ask → read → score → summarise → save) with fake
 * AI calls, so the wiring is tested without API keys or cost.
 */

const input: ReportInput = { brand: "Crease & Co", website: "", category: "cricket gear", country: "India", competitors: ["SG"] };

const questions: GeneratedQuery[] = [
  ...Array.from({ length: 6 }, (_, i) => ({ id: i + 1, type: "discovery" as const, intent: `intent ${i + 1}`, text: `discovery ${i + 1}` })),
  { id: 7, type: "brand_check", intent: "reputation", text: "is crease & co good" },
  { id: 8, type: "brand_check", intent: "complaints", text: "crease & co complaints" },
  { id: 9, type: "comparison", intent: "vs SG", text: "crease & co vs SG" },
  { id: 10, type: "comparison", intent: "vs SS", text: "crease & co vs SS" },
];

// Model A names the brand second on odd discovery questions; model B never does.
const providers: Provider[] = [
  { name: "A", model: "a", ask: async (q) => ({ text: /discovery [135]/.test(q) ? "Try SG, then Crease & Co." : "Try SG or SS.", refused: false }) },
  { name: "B", model: "b", ask: async () => ({ text: "Try SS or MRF.", refused: false }) },
  { name: "Broken", model: "x", ask: async () => { throw new Error("timeout"); } },
];

test("a full check scores, summarises and saves a consistent report", async () => {
  let saved: Report | null = null;
  let readCalls = 0;
  const steps: Steps = {
    generateQuestions: async () => questions,
    // A fake "model reading": pulls brands out with a regex, then the real interpret() runs.
    readAnswers: async (answers) => {
      readCalls++;
      return answers.map((a, i) => {
        const brands: string[] = a.answer.match(/SG|SS|MRF|Crease & Co/g) ?? [];
        const named = brands.includes("Crease & Co");
        const raw = {
          answer_id: i + 1,
          brands,
          brand_named: named,
          brand_known: a.model === "A", // B claims not to know the brand
          descriptors: named ? ["then Crease & Co", "a phrase that isn't in the answer"] : [],
          sentiment: (named ? "positive" : "neutral") as "positive" | "neutral",
          excerpt: a.answer,
        };
        return interpret(raw, a, input.brand);
      });
    },
    summarize: async () => ({ verdict: "Sometimes named.", fixes: [{ title: "Do a thing", why: "Because.", action: "Do it." }] }),
    saveReport: async (r) => {
      saved = r;
    },
  };

  const job = createJob("test-run-1");
  const events: PipelineEvent[] = [];
  job.listeners.add((e) => events.push(e));
  await runCheck(job, input, providers, steps);

  const last = events.at(-1);
  assert.equal(last?.type, "done", JSON.stringify(last));
  assert.ok(saved, "report was saved");
  const report = saved as Report;

  // 30 calls asked (one provider always fails), 20 usable answers read.
  const askProgress = events.filter((e) => e.type === "progress" && e.step === "asking");
  assert.equal(askProgress.length, 30);
  // 20 answers read in batches of 10: two analysis calls, not twenty.
  assert.equal(readCalls, 2);
  const lastRead = events.filter((e) => e.type === "progress" && e.step === "reading").at(-1);
  assert.deepEqual(lastRead, { type: "progress", step: "reading", done: 20, total: 20 });

  // A named the brand (2nd) on 3 of 6 discovery questions; B on none.
  assert.deepEqual(report.models, [{ name: "A", mentionRate: 0.5 }, { name: "B", mentionRate: 0 }]);
  assert.equal(report.stats.mentionRate, 3 / 12);
  assert.equal(report.stats.avgPosition, 2);
  assert.equal(report.stats.sentiment, "positive");
  // SS: 3 from A + 6 from B. SG (the founder's pick): 6 from A. MRF picked up automatically: 6 from B.
  const sov = Object.fromEntries(report.shareOfVoice.map((s) => [s.name, s.mentions]));
  assert.deepEqual(sov, { SS: 9, SG: 6, MRF: 6, "Crease & Co": 3 });
  assert.equal(report.shareOfVoice[0].name, "SS");
  // 85% × (3 × 0.8 / 12) = 17. The brand-check answers never name the brand, so they add nothing.
  assert.equal(report.score, 17);
  assert.equal(report.queries.find((q) => q.type === "brand_check")?.results.some((r) => r.mentioned), false);
  assert.deepEqual(report.descriptors, ["then Crease & Co"]);
  assert.equal(report.queries.every((q) => q.results.length === 2), true);
});

test("a check where every model fails reports an error", async () => {
  const job = createJob("test-run-2");
  const events: PipelineEvent[] = [];
  job.listeners.add((e) => events.push(e));
  const failing: Provider[] = [{ name: "X", model: "x", ask: async () => { throw new Error("down"); } }];
  await runCheck(job, input, failing, {
    generateQuestions: async () => questions,
    readAnswers: async () => { throw new Error("unreachable"); },
    summarize: async () => { throw new Error("unreachable"); },
    saveReport: async () => {},
  });
  const last = events.at(-1);
  assert.equal(last?.type, "error");
  assert.match(last?.type === "error" ? last.message : "", /None of the AI models/);
});
