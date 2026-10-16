import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { pct } from "../lib/format";
import { EASE_OUT, inViewOnce, rise, stagger } from "../lib/motion";
import { DEMO_REPORT_ID, ZERO_DEMO_REPORT_ID, sampleReports } from "@mentioned/shared/fixtures";
import { ArrowRightIcon } from "./Icons";
import { Mark } from "./Mark";

const report = sampleReports[DEMO_REPORT_ID];

/** A summary of the sample report that links to the full thing. */
export function SampleReportCard() {
  return (
    <motion.section
      id="sample"
      aria-labelledby="sample-title"
      initial="hidden"
      whileInView="show"
      viewport={inViewOnce}
      variants={stagger}
      className="grid gap-x-4 border-t-2 border-rule pt-2 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]"
    >
      <motion.div variants={rise} className="mb-3">
        <h2 id="sample-title" className="font-display text-display-sm text-ink">
          Sample report
        </h2>
        <p className="mt-1 text-base text-ink-2">A cricket gear brand from Meerut, checked in October.</p>
        <Link
          to={`/report/${ZERO_DEMO_REPORT_ID}`}
          className="mt-1 inline-block text-sm text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-ink"
        >
          Or see a brand that scored 0
        </Link>
      </motion.div>

      <motion.div variants={rise}>
        <Link to={`/report/${DEMO_REPORT_ID}`} className="panel group block p-2 sm:p-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm text-ink-3">
                {report.category}, {report.country}
              </p>
              <p className="font-display text-display-md text-ink">
                {report.brand}
              </p>
            </div>
            <p className="flex items-end gap-1">
              <Mark className="mark-score font-display text-figure-lg tracking-[-0.04em] text-ink" delay={300}>
                {report.score}
              </Mark>
              <span className="mb-1 text-sm text-ink-3">out of 100</span>
            </p>
          </div>
          <p className="mt-2 max-w-[40ch] font-display text-xl font-normal text-ink">{report.verdict}</p>
          <ul className="mt-2 border-t border-line" aria-label="Mention rate by AI model">
            {report.models.map((m, i) => (
              <li key={m.name} className="grid grid-cols-[80px_minmax(0,1fr)_48px] items-center gap-1.5 border-b border-line py-1 text-sm">
                <span className="text-ink">{m.name}</span>
                <span className="h-1 bg-surface-sunk">
                  <motion.span
                    className="bar-brand block h-full origin-left"
                    style={{ width: pct(m.mentionRate) }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={inViewOnce}
                    transition={{ duration: 0.9, delay: 0.2 + i * 0.1, ease: EASE_OUT }}
                  />
                </span>
                <span className="tabular text-right text-ink">{pct(m.mentionRate)}</span>
              </li>
            ))}
          </ul>
          <span className="mt-2 inline-flex items-center gap-0.5 text-base font-semibold text-ink">
            Read the sample report
            <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </Link>
      </motion.div>
    </motion.section>
  );
}
