import type { QueryType, ReportInput } from "@mentioned/shared";
import { DEMO_REPORT_ID } from "@mentioned/shared/fixtures";
import { emit, type Job } from "../store";

// DEMO_DELAY_SCALE shortens the simulated waits (tests set it near 0).
const scale = Number(process.env.DEMO_DELAY_SCALE ?? 1);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms * scale));

/** Stand-in questions for demo mode, built from the founder's input. */
function demoQuestions({ brand, category, country, competitors }: ReportInput): { type: QueryType; text: string }[] {
  const cat = category.toLowerCase();
  const [first, second] = competitors;
  return [
    { type: "discovery", text: `best ${cat} brand in ${country.toLowerCase()} right now?` },
    { type: "discovery", text: `decent ${cat} on a budget, what should i buy` },
    { type: "discovery", text: `${cat} for a complete beginner, where do i even start` },
    { type: "discovery", text: `which ${cat} brands actually last? dont want to buy twice` },
    { type: "discovery", text: `${cat} made in ${country} that's genuinely good quality` },
    { type: "discovery", text: `what actually matters when choosing ${cat}, which features` },
    { type: "brand_check", text: `is ${brand} any good? thinking of ordering` },
    { type: "brand_check", text: `${brand} complaints? anything i should know first` },
    { type: "comparison", text: first ? `${brand} vs ${first}, which is better` : `${brand} vs the popular alternatives, worth it?` },
    { type: "comparison", text: second ? `${brand} or ${second}?` : `cheaper alternatives to ${brand}?` },
  ];
}

/**
 * Demo mode (no Anthropic key): plays the same events a real check would, about
 * 14 seconds long, and finishes on the sample report.
 */
export async function runDemo(job: Job, input: ReportInput, modelCount: number): Promise<void> {
  const answers = demoQuestions(input).length * modelCount;
  emit(job, { type: "step", step: "questions", status: "active" });
  await sleep(900);
  for (const [i, q] of demoQuestions(input).entries()) {
    emit(job, { type: "question", id: i + 1, queryType: q.type, text: q.text });
    await sleep(480);
  }
  emit(job, { type: "step", step: "questions", status: "done" });
  for (const [step, ms] of [["asking", 110], ["reading", 70]] as const) {
    emit(job, { type: "step", step, status: "active" });
    for (let done = 1; done <= answers; done++) {
      await sleep(ms);
      emit(job, { type: "progress", step, done, total: answers });
    }
    emit(job, { type: "step", step, status: "done" });
  }
  emit(job, { type: "step", step: "scoring", status: "active" });
  await sleep(1400);
  emit(job, { type: "step", step: "scoring", status: "done" });
  emit(job, { type: "done", id: DEMO_REPORT_ID, isSample: true });
}
