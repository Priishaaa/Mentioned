import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Report } from "@mentioned/shared";
import { SCORE_BANDS, bandFor, formatDate, ordinal } from "../lib/format";
import { EASE_OUT, rise, stagger } from "../lib/motion";
import { CountUp } from "./CountUp";
import { CheckIcon, DownloadIcon, LinkIcon, RefreshIcon } from "./Icons";
import { Mark } from "./Mark";

/** The report's answer at a glance: who, the verdict, the score, four numbers, and actions. */
export function ReportHero({ report }: { report: Report }) {
  const { brand, category, country, createdAt, score, verdict, stats } = report;
  const discoveryAnswers = report.queries.filter((q) => q.type === "discovery").reduce((n, q) => n + q.results.length, 0);
  const brandMentions = report.shareOfVoice.find((s) => s.isBrand)?.mentions ?? 0;
  const leader = [...report.shareOfVoice].filter((s) => !s.isBrand).sort((a, b) => b.mentions - a.mentions)[0];
  const ahead = leader && leader.mentions > brandMentions ? leader : null;

  const figures = [
    { label: "Mention rate", value: `${Math.round(stats.mentionRate * 100)}%`, note: `${Math.round(stats.mentionRate * discoveryAnswers)} of ${discoveryAnswers} answers` },
    {
      label: "Usual position",
      value: stats.avgPosition === null ? "—" : ordinal(Math.round(stats.avgPosition)),
      note: stats.avgPosition === null ? "Not ranked yet" : "when named",
    },
    { label: "Tone", value: stats.sentiment.charAt(0).toUpperCase() + stats.sentiment.slice(1), note: score === 0 ? "Nothing said yet" : "when described" },
    { label: "Named most", value: ahead ? ahead.name : "You", note: ahead ? `${ahead.mentions} mentions vs your ${brandMentions}` : "You lead" },
  ];

  return (
    <motion.header initial="hidden" animate="show" variants={stagger} className="pb-4 pt-3 sm:pt-5">
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <p className="text-sm text-ink-3">
          {category} · {country} · {formatDate(createdAt)}
        </p>
        <Toolbar />
      </motion.div>

      <div className="mt-3 grid items-end gap-x-6 gap-y-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <motion.h1 variants={rise} className="break-words font-display text-display-lg text-ink">
            {brand}
          </motion.h1>
          <motion.p variants={rise} className="mt-2 max-w-[34ch] font-display text-display-sm font-normal text-ink-2">
            {verdict}
          </motion.p>
        </div>
        <motion.div variants={rise} className="md:min-w-[280px]">
          <p className="flex items-end gap-1">
            <Mark className="mark-score font-display text-[clamp(5rem,3rem+7vw,8.5rem)] leading-[0.85] tracking-[-0.04em] text-ink" delay={1300}>
              <CountUp value={score} duration={1.6} delay={0.2} />
            </Mark>
            <span className="mb-1.5 text-sm text-ink-3">/ 100</span>
          </p>
          <ScoreScale score={score} />
        </motion.div>
      </div>

      <motion.dl variants={rise} className="mt-5 grid grid-cols-2 border-y border-line md:grid-cols-4">
        {figures.map((f, i) => (
          <div key={f.label} className={`border-line py-2 ${FIGURE_CELL[i]}`}>
            <dt className="text-xs text-ink-3">{f.label}</dt>
            <dd className="mt-0.5 truncate font-display text-title-lg text-ink">{f.value}</dd>
            <dd className="text-xs text-ink-3">{f.note}</dd>
          </div>
        ))}
      </motion.dl>
    </motion.header>
  );
}

/*
 * Cell dividers for the 2×2 (phone) / 1×4 (desktop) figures grid:
 * a left rule on the right-hand cells, a top rule on the second row (phone only).
 */
const FIGURE_CELL = [
  "pr-2",
  "border-l pl-2 md:pl-3",
  "max-md:border-t md:border-l md:pl-3",
  "border-l pl-2 max-md:border-t md:pl-3",
];

function ScoreScale({ score }: { score: number }) {
  const current = bandFor(score);
  return (
    <figure className="mt-2">
      <figcaption className="sr-only">
        Score {score} out of 100: {current.label}.
      </figcaption>
      <div aria-hidden="true" className="relative h-0.5 bg-line">
        <motion.div
          className="absolute inset-y-0 left-0 origin-left bg-ink"
          style={{ width: `${score}%` }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.6, delay: 0.2, ease: EASE_OUT }}
        />
      </div>
      <p aria-hidden="true" className="mt-1 flex justify-between text-xs text-ink-3">
        <span className="font-semibold text-ink">{current.label}</span>
        <span>{SCORE_BANDS.findIndex((b) => b === current) + 1} of {SCORE_BANDS.length}</span>
      </p>
    </figure>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Share, save as PDF, run another check. Quiet until needed. */
function Toolbar() {
  const [copied, setCopied] = useState<"idle" | "yes" | "no">("idle");
  useEffect(() => {
    if (copied === "idle") return;
    const t = setTimeout(() => setCopied("idle"), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const btn = "inline-flex h-4 items-center gap-0.5 px-1 text-sm text-ink-2 transition-colors hover:bg-surface-sunk hover:text-ink";
  return (
    <div className="no-print flex items-center gap-0.5" aria-label="Report actions" role="group">
      <button type="button" className={btn} onClick={async () => setCopied((await copyText(window.location.href)) ? "yes" : "no")}>
        {copied === "yes" ? <CheckIcon /> : <LinkIcon />}
        <span aria-live="polite">{copied === "yes" ? "Copied" : copied === "no" ? "Copy failed" : "Share"}</span>
      </button>
      <button type="button" className={btn} onClick={() => window.print()}>
        <DownloadIcon /> PDF
      </button>
      <Link to="/#check" className={btn}>
        <RefreshIcon /> New check
      </Link>
    </div>
  );
}
