import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { modelCountWords, useModels } from "../lib/models";
import { inViewOnce, rise, stagger } from "../lib/motion";
import { ArrowRightIcon } from "./Icons";
import { Mark } from "./Mark";

/** Closing call to action: an inverted ink band, with an empty score card waiting to be filled. */
export function FinalCta() {
  const models = useModels();
  return (
    <motion.section
      aria-labelledby="cta-title"
      initial="hidden"
      whileInView="show"
      viewport={inViewOnce}
      variants={stagger}
      className="grid items-center gap-6 bg-ink px-3 py-6 text-bg sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
    >
      <div>
        <motion.h2 variants={rise} id="cta-title" className="max-w-[18ch] font-display text-display-md">
          Find out what AI says about{" "}
          <Mark className="hl-brand" delay={400}>
            you
          </Mark>
          .
        </motion.h2>
        <motion.p variants={rise} className="mt-2 max-w-[46ch] text-lg opacity-80">
          Ten questions, {modelCountWords(models.length)}, about a minute. You'll know whether you're on the shortlist and
          what to do if you're not.
        </motion.p>
        <motion.div variants={rise} className="mt-4">
          <Link
            to="/#check"
            className="lift group inline-flex min-h-6 items-center gap-1 border border-bg bg-bg px-3 text-base font-medium text-ink [--lift-shadow:var(--accent)]"
          >
            Check my brand
            <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>

      {/* Mirrors the sample report's score card, still empty. Decorative. */}
      <motion.div
        variants={rise}
        aria-hidden="true"
        className="mx-auto w-full max-w-[360px] border border-bg bg-bg p-3 text-ink shadow-[8px_8px_0_0_var(--accent)] lg:mr-0"
      >
        <p className="text-sm font-semibold">Your visibility score</p>
        <p className="mt-1 flex items-end gap-1">
          <Mark className="mark-score font-display text-figure-lg tracking-[-0.04em]" delay={700}>
            ?
          </Mark>
          <span className="mb-1 text-sm text-ink-3">out of 100</span>
        </p>
        <ul className="mt-3 border-t border-line">
          {models.map((m) => (
            <li key={m} className="grid grid-cols-[72px_minmax(0,1fr)_32px] items-center gap-1.5 border-b border-line py-1 text-sm">
              <span className="text-ink-2">{m}</span>
              <span className="h-1 border border-dashed border-line-strong" />
              <span className="text-right text-ink-3">?</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.section>
  );
}
