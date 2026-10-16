import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { DEMO_REPORT_ID, ZERO_DEMO_REPORT_ID, sampleReports } from "@mentioned/shared/fixtures";
import { inViewOnce, rise, stagger } from "../lib/motion";
import { ArrowRightIcon } from "./Icons";

/** Two finished reports to look at before running your own. */
export function SampleLinks() {
  const samples = [sampleReports[DEMO_REPORT_ID], sampleReports[ZERO_DEMO_REPORT_ID]];
  return (
    <motion.section aria-labelledby="samples-title" initial="hidden" whileInView="show" viewport={inViewOnce} variants={stagger}>
      <motion.h2 variants={rise} id="samples-title" className="mb-1.5 text-sm font-semibold text-ink">
        See an example report
      </motion.h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {samples.map((r) => (
          <motion.li key={r.id} variants={rise}>
            <Link to={`/report/${r.id}`} className="panel group flex items-center justify-between gap-2 p-2">
              <span className="min-w-0">
                <span className="block truncate font-display text-title-lg text-ink">{r.brand}</span>
                <span className="text-sm text-ink-3">{r.category}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="mark-score font-display text-[2.5rem] leading-none text-ink">{r.score}</span>
                <ArrowRightIcon className="text-[18px] text-ink-2 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
}
