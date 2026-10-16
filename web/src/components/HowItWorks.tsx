import { motion } from "framer-motion";
import { listModels, useModels } from "../lib/models";
import { inViewOnce, rise, stagger } from "../lib/motion";

const stepsFor = (models: string[]) => [
  {
    title: "We write 10 shopper questions",
    body: "Six never mention you, like “best running shoes for flat feet under ₹5,000”. Four ask about you by name or against a competitor.",
  },
  {
    title: `We ask ${listModels(models)}`,
    body:
      models.length > 1
        ? "Every question goes to each of them, so you can see where each one sends shoppers."
        : "Every question goes to it, so you can see exactly where it sends shoppers.",
  },
  {
    title: "You get a score and three fixes",
    body: "Who gets recommended instead of you, how AI describes you, and what to change first.",
  },
];

export function HowItWorks() {
  const STEPS = stepsFor(useModels());
  return (
    <motion.section
      id="how"
      aria-labelledby="how-title"
      initial="hidden"
      whileInView="show"
      viewport={inViewOnce}
      variants={stagger}
      className="grid gap-x-4 border-t-2 border-rule pt-2 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]"
    >
      <motion.h2 variants={rise} id="how-title" className="mb-2 font-display text-display-sm text-ink">
        How it works
      </motion.h2>
      <ol className="border-t border-line md:border-t-0">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.title}
            variants={rise}
            className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-1 border-b border-line py-2 first:md:pt-0.5"
          >
            <span aria-hidden="true" className="font-display text-xl text-ink">
              {i + 1}.
            </span>
            <div>
              <h3 className="text-base font-semibold text-ink">{s.title}</h3>
              <p className="mt-0.5 text-base text-ink-2">{s.body}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </motion.section>
  );
}
