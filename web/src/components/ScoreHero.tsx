import { motion } from "framer-motion";
import { SCORE_BANDS, bandFor, formatDate } from "../lib/format";
import { EASE_OUT, rise, stagger } from "../lib/motion";
import type { Report } from "@mentioned/shared";
import { modelCountWords } from "../lib/models";
import { CountUp } from "./CountUp";
import { Mark } from "./Mark";
import { ArrowRightIcon } from "./Icons";

type Props = { report: Report; modelCount: number };

export function ScoreHero({ report, modelCount }: Props) {
  const { brand, category, country, createdAt, score, verdict, queries } = report;
  return (
    <motion.header initial="hidden" animate="show" variants={stagger} className="pb-5 pt-4 sm:pt-6">
      <motion.p variants={rise} className="flex flex-wrap gap-x-1 text-sm text-ink-2">
        <span className="font-semibold text-ink">AI visibility report</span>
        <span className="whitespace-nowrap">
          <span aria-hidden="true" className="mr-1 text-ink-3">/</span>
          {category}, {country}
        </span>
        <span className="whitespace-nowrap">
          <span aria-hidden="true" className="mr-1 text-ink-3">/</span>
          {formatDate(createdAt)}
        </span>
      </motion.p>

      <motion.div variants={rise} className="mt-2 border-t-2 border-rule" />

      <div className="grid gap-x-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 pt-3">
          <motion.h1 variants={rise} className="break-words font-display text-display-lg text-ink">
            {brand}
          </motion.h1>
          <motion.p variants={rise} className="mt-3 max-w-[30ch] font-display text-display-sm font-normal text-ink">
            {verdict}
          </motion.p>
          <motion.p variants={rise} className="mt-2 text-sm text-ink-3">
            Based on {queries.length} shopper questions asked to {modelCountWords(modelCount)}.
          </motion.p>
          {score === 0 && (
            <motion.a
              variants={rise}
              href="#fixes"
              className="no-print mt-3 inline-flex items-center gap-0.5 text-base font-medium text-ink underline decoration-ink underline-offset-4"
            >
              Skip to what to fix <ArrowRightIcon />
            </motion.a>
          )}
        </div>

        <motion.div variants={rise} className="mt-4 border-t border-line pt-3 md:mt-0 md:min-w-[300px] md:border-l md:border-t-0 md:pl-4">
          <p className="text-sm font-semibold text-ink">Visibility score</p>
          <p className="mt-1 flex items-end gap-1">
            <Mark className="mark-score font-display text-score tracking-[-0.04em] text-ink" delay={1300}>
              <CountUp value={score} duration={1.6} delay={0.2} />
            </Mark>
            <span className="mb-2 text-base text-ink-3">out of 100</span>
          </p>
          <ScoreScale score={score} />
        </motion.div>
      </div>
    </motion.header>
  );
}

function ScoreScale({ score }: { score: number }) {
  const current = bandFor(score);
  return (
    <figure className="mt-3">
      <figcaption className="sr-only">
        Score {score} out of 100, in the “{current.label}” band.
      </figcaption>
      <div aria-hidden="true" className="relative h-1 border border-ink">
        <motion.div
          className="absolute inset-y-0 left-0 origin-left bg-accent"
          style={{ width: `${score}%` }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.6, delay: 0.2, ease: EASE_OUT }}
        />
        {SCORE_BANDS.slice(1).map((b) => (
          <span key={b.from} className="absolute inset-y-0 w-px bg-ink" style={{ left: `${b.from}%` }} />
        ))}
      </div>
      <ol aria-hidden="true" className="mt-1 grid grid-cols-4 gap-x-1 text-xs leading-tight">
        {SCORE_BANDS.map((b) => (
          <li key={b.from} className={b === current ? "font-semibold text-ink" : "text-ink-3"}>
            {b.label}
          </li>
        ))}
      </ol>
    </figure>
  );
}
