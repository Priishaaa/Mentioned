import { motion } from "framer-motion";
import { listModels, useModels } from "../lib/models";
import { inViewOnce, rise, stagger } from "../lib/motion";

/** Three steps, one line each. */
export function HowItWorks() {
  const models = useModels();
  const steps = [
    { title: "Ten shopper questions", body: "Written for your category. Most never mention you." },
    { title: `Asked to ${listModels(models)}`, body: "The way a shopper would ask before buying." },
    { title: "A score and three fixes", body: "Who's named instead, and what to change first." },
  ];
  return (
    <motion.section
      aria-label="How it works"
      initial="hidden"
      whileInView="show"
      viewport={inViewOnce}
      variants={stagger}
      className="grid gap-3 border-t border-line pt-3 sm:grid-cols-3 sm:gap-4"
    >
      {steps.map((s, i) => (
        <motion.div key={s.title} variants={rise} className="flex gap-1.5">
          <span aria-hidden="true" className="font-display text-title-lg leading-none text-ink-3">
            {i + 1}
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">{s.title}</h2>
            <p className="mt-0.5 text-sm text-ink-2">{s.body}</p>
          </div>
        </motion.div>
      ))}
    </motion.section>
  );
}
