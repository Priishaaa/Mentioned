import { AnimatePresence, motion } from "framer-motion";
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { listModels, useModels } from "../lib/models";
import { EASE_OUT, inViewOnce, rise, stagger } from "../lib/motion";
import { DEMO_REPORT_ID } from "@mentioned/shared/fixtures";

const faqsFor = (models: string[]) => [
  {
    q: "What does the visibility score measure?",
    a: "How often the AI models name you when a shopper asks a question that doesn't mention you, and how early in the answer they do it. Questions that ask about you by name are shown in the report, but they matter less to the score: being known when asked is different from being recommended.",
  },
  {
    q: "Which AI models do you check?",
    a:
      models.length > 1
        ? `${listModels(models)}. Every question goes to each of them, so you can see where they agree and where they don't.`
        : `${listModels(models)}, for now. More assistants can be added, and every question goes to each one that's switched on.`,
  },
  {
    q: "Why might my results differ from what I see in the AI apps?",
    a: "We ask through each model's API. The consumer apps can also search the web, remember past chats and personalise answers, so a single person's chat can differ. The API gives a cleaner, repeatable baseline that's comparable over time.",
  },
  {
    q: "Where do the questions come from?",
    a: "We write ten for your category and country, the way real shoppers type: six that never name you, two about your reputation, and two that compare you with a competitor.",
  },
  {
    q: "How often should I check?",
    a: "AI answers shift as models update and as new reviews and articles appear. Check again a few weeks after you act on the fixes, so you can see whether they worked.",
  },
  {
    q: "Can I add my competitors?",
    a: "Yes, up to three. We track how often each of them is named, and use them in the comparison questions.",
  },
];

export function Faq() {
  const FAQS = faqsFor(useModels());
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <motion.section
      id="faq"
      aria-labelledby="faq-title"
      initial="hidden"
      whileInView="show"
      viewport={inViewOnce}
      variants={stagger}
      className="grid gap-x-4 border-t-2 border-rule pt-2 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]"
    >
      <motion.div variants={rise} className="mb-3">
        <h2 id="faq-title" className="font-display text-display-sm text-ink">
          Questions
        </h2>
        <p className="mt-1 text-base text-ink-2">
          Still unsure?{" "}
          <Link to={`/report/${DEMO_REPORT_ID}`} className="link-draw text-ink">
            Read a sample report
          </Link>
          .
        </p>
      </motion.div>

      <motion.ul variants={rise} className="border-t border-ink">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          const triggerId = `${baseId}-q-${i}`;
          const panelId = `${baseId}-a-${i}`;
          return (
            <li key={item.q} className="border-b border-line">
              <h3>
                <button
                  id={triggerId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="group flex w-full items-center justify-between gap-2 py-2 text-left"
                >
                  <span className="font-display text-lg text-ink">{item.q}</span>
                  {/* Thin plus that becomes a minus when open. */}
                  <span aria-hidden="true" className="relative grid size-3 shrink-0 place-items-center text-ink-2 group-hover:text-ink">
                    <span className="absolute h-px w-2 bg-current" />
                    <span className={`absolute h-2 w-px bg-current transition-transform duration-200 ${isOpen ? "scale-y-0" : ""}`} />
                  </span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-[64ch] pb-2.5 text-base text-ink-2">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </motion.ul>
    </motion.section>
  );
}
