import { AnimatePresence, motion } from "framer-motion";
import { useId, useState } from "react";
import { EASE_OUT, inViewOnce } from "../lib/motion";
import type { Query, Report } from "@mentioned/shared";
import { ChevronDownIcon, MentionedIcon, MissingIcon } from "./Icons";
import { Reveal } from "./Section";

type Props = { models: Report["models"]; discovery: Query[] };

/** One row per AI model: how often it named the brand. Click a row to see which questions. */
export function ModelBars({ models, discovery }: Props) {
  const sorted = [...models].sort((a, b) => b.mentionRate - a.mentionRate);
  const [open, setOpen] = useState<string | null>(null);
  const baseId = useId();

  return (
    <ul className="border-t border-line">
      {sorted.map((m, i) => {
        const results = discovery.map((q) => ({ q, r: q.results.find((x) => x.model === m.name) }));
        const count = results.filter(({ r }) => r?.mentioned).length;
        const percent = Math.round(m.mentionRate * 100);
        const isOpen = open === m.name;
        const panelId = `${baseId}-${i}`;
        return (
          <Reveal as="li" key={m.name} className="border-b border-line">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : m.name)}
              className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 py-2 text-left transition-colors hover:bg-surface sm:grid-cols-[112px_minmax(0,1fr)_128px]"
            >
              <span className="flex items-center gap-0.5 text-base font-semibold text-ink">
                {m.name}
                <ChevronDownIcon className={`text-[16px] text-ink-3 transition-transform duration-200 group-hover:text-ink ${isOpen ? "rotate-180" : ""}`} />
              </span>
              <span className="tabular text-right text-sm text-ink-2 sm:order-last">
                <span className="font-display text-title-lg leading-none text-ink">{percent}%</span>
                <span className="ml-1">{count === 0 ? "never named you" : `${count} of ${discovery.length}`}</span>
              </span>
              <span
                role="meter"
                aria-label={`${m.name} mention rate`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-valuetext={`${count} of ${discovery.length} questions`}
                className="relative col-span-2 block h-2 bg-surface-sunk sm:col-span-1"
              >
                <motion.span
                  className="bar-brand absolute inset-y-0 left-0 block origin-left transition-[filter] group-hover:brightness-105"
                  style={{ width: `${percent}%` }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={inViewOnce}
                  transition={{ duration: 0.9, delay: 0.1 + i * 0.1, ease: EASE_OUT }}
                />
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <ol className="grid gap-x-3 pb-2 sm:grid-cols-2 sm:pl-[112px]">
                    {results.map(({ q, r }, n) => (
                      <motion.li
                        key={q.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: n * 0.04 }}
                        className="flex items-start gap-1 py-0.5 text-sm"
                      >
                        {r?.mentioned ? <MentionedIcon className="mt-0.5 shrink-0" /> : <MissingIcon className="mt-0.5 shrink-0" />}
                        <span className={r?.mentioned ? "text-ink" : "text-ink-3"}>
                          <span className="font-medium">{q.intent}</span>
                          {r?.mentioned && r.position ? <span className="tabular text-ink-2"> · named #{r.position}</span> : null}
                        </span>
                      </motion.li>
                    ))}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </Reveal>
        );
      })}
    </ul>
  );
}
