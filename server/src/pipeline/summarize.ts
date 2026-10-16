import type { Query, Report } from "@mentioned/shared";
import * as z from "zod/v4";
import { structured } from "../analysis";
import { summaryPrompt } from "../prompts";

const SummarySchema = z.object({
  verdict: z.string(),
  fixes: z.array(z.object({ title: z.string(), why: z.string(), action: z.string() })),
});

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** The findings, as plain text the summary prompt can quote from. */
export function describeFindings(report: Omit<Report, "verdict" | "fixes">): string {
  const lines: string[] = [];
  const discovery = report.queries.filter((q) => q.type === "discovery");
  const answers = discovery.reduce((n, q) => n + q.results.length, 0);
  lines.push(`Visibility score: ${report.score}/100.`);
  lines.push(
    `Named in ${pct(report.stats.mentionRate)} of ${answers} answers to questions that don't mention the brand` +
      (report.stats.avgPosition ? `, usually around position ${report.stats.avgPosition.toFixed(1)}.` : "."),
  );
  lines.push(`By model: ${report.models.map((m) => `${m.name} ${pct(m.mentionRate)}`).join(", ")}.`);
  lines.push(`Mentions across those answers: ${report.shareOfVoice.map((s) => `${s.name}${s.isBrand ? " (this brand)" : ""} ${s.mentions}`).join(", ")}.`);
  lines.push(`Visible for: ${report.intents.filter((i) => i.status !== "invisible").map((i) => i.label).join(", ") || "none"}.`);
  lines.push(`Not visible for: ${report.intents.filter((i) => i.status === "invisible").map((i) => i.label).join(", ") || "none"}.`);
  lines.push(`Tone when named: ${report.stats.sentiment}.`);
  if (report.descriptors.length) lines.push(`Phrases AI used about the brand: ${report.descriptors.map((d) => `"${d}"`).join("; ")}.`);
  lines.push("", "Answers to questions that name the brand:");
  for (const q of report.queries.filter((q: Query) => q.type !== "discovery"))
    for (const r of q.results) lines.push(`- ${r.model}, asked "${q.text}": ${r.excerpt}`);
  return lines.join("\n");
}

export async function summarize(report: Omit<Report, "verdict" | "fixes">): Promise<Pick<Report, "verdict" | "fixes">> {
  const { verdict, fixes } = await structured(
    SummarySchema,
    summaryPrompt({ brand: report.brand, category: report.category, country: report.country, facts: describeFindings(report) }),
  );
  return { verdict: verdict.trim(), fixes: fixes.slice(0, 3) };
}
