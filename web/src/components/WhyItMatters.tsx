import { motion } from "framer-motion";
import { EASE_OUT, inViewOnce, rise, stagger } from "../lib/motion";
import { Mark } from "./Mark";

const LINK_WIDTHS = [86, 72, 90, 64, 78, 70, 84, 60, 74, 68];

/**
 * The shift in one picture: search gives ten links to choose from,
 * an AI assistant gives one answer with a few names in it.
 */
export function WhyItMatters() {
  return (
    <motion.section
      aria-labelledby="why-title"
      initial="hidden"
      whileInView="show"
      viewport={inViewOnce}
      variants={stagger}
      className="grid gap-x-6 gap-y-4 border-t-2 border-rule pt-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <motion.div variants={rise}>
        <h2 id="why-title" className="font-display text-display-md text-ink">
          Search gives shoppers ten links. AI gives them one answer.
        </h2>
        <p className="mt-2 max-w-[48ch] text-lg text-ink-2">
          When a shopper asks an assistant what to buy, the answer usually names two or three brands, and there's
          nothing to scroll past. If yours isn't one of them, you aren't on the shortlist, however good your ads are.
        </p>
      </motion.div>

      <motion.div variants={rise} className="grid grid-cols-2 items-start gap-2" aria-hidden="true">
        <figure className="border border-line bg-surface p-2">
          <figcaption className="mb-1.5 text-xs font-semibold text-ink-2">Search results</figcaption>
          <ul className="grid gap-1">
            {LINK_WIDTHS.map((w, i) => (
              <li key={i} className="grid gap-0.5">
                <motion.span
                  className="block h-1 origin-left bg-line-strong/50"
                  style={{ width: `${w}%` }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={inViewOnce}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease: EASE_OUT }}
                />
                <span className="block h-0.5 bg-surface-sunk" style={{ width: `${w - 20}%` }} />
              </li>
            ))}
          </ul>
        </figure>

        <figure className="panel p-2">
          <figcaption className="mb-1.5 text-xs font-semibold text-ink">AI answer</figcaption>
          <p className="text-sm leading-[1.75] text-ink-2">
            For that budget, most people go with <mark className="hl-rival">Kicklane</mark> or{" "}
            <mark className="hl-rival">Northpaw</mark>. <Mark delay={500}>Your brand</Mark> is a newer option worth a look, and it
            has a wider toe box.
          </p>
          <p className="mt-2 border-t border-line pt-1.5 font-display text-lg leading-snug text-ink">
            Three names. Is yours one of them?
          </p>
        </figure>
      </motion.div>
    </motion.section>
  );
}
