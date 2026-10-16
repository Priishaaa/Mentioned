import { motion } from "framer-motion";
import type { Report } from "@mentioned/shared";
import { Reveal } from "./Section";

type Props = {
  fix: Report["fixes"][number];
  index: number;
  done: boolean;
  onToggle: () => void;
};

/** One row of the fixes table: number, title, why, what to do, and a box to tick it off. */
export function FixCard({ fix, index, done, onToggle }: Props) {
  return (
    <Reveal
      as="li"
      className="group grid gap-x-3 gap-y-1 border-b border-line py-3 md:grid-cols-[40px_minmax(0,4fr)_minmax(0,4fr)_minmax(0,5fr)]"
    >
      <span aria-hidden="true" className={`font-display text-title-lg leading-none transition-colors ${done ? "text-ink-3" : "text-ink"}`}>
        {index + 1}.
      </span>
      <div>
        <h3 className={`font-display text-title-lg transition-colors ${done ? "text-ink-3" : "text-ink"}`}>
          <span className="sr-only">Fix {index + 1}: </span>
          <span
            className={`line-through decoration-2 transition-[text-decoration-color] duration-300 ${done ? "decoration-ink-3" : "decoration-transparent"}`}
          >
            {fix.title}
          </span>
        </h3>
        <button
          type="button"
          aria-pressed={done}
          onClick={onToggle}
          className="no-print mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-ink"
        >
          <span className={`grid size-2.5 place-items-center border border-ink transition-colors ${done ? "bg-ink text-bg" : "bg-surface group-hover:bg-surface-sunk"}`}>
            <svg viewBox="0 0 24 24" className="size-2" fill="none" stroke="currentColor" strokeWidth={3.5} aria-hidden="true">
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={false} animate={{ pathLength: done ? 1 : 0 }} transition={{ duration: 0.25 }} />
            </svg>
          </span>
          {done ? "Done" : "Mark as done"}
        </button>
      </div>
      <div className={`text-sm transition-opacity ${done ? "opacity-60" : ""}`}>
        <p className="font-semibold text-ink">Why</p>
        <p className="mt-0.5 text-ink-2">{fix.why}</p>
      </div>
      <div className={`text-sm transition-opacity ${done ? "opacity-60" : ""}`}>
        <p className="font-semibold text-ink">What to do</p>
        <p className="mt-0.5 text-ink">{fix.action}</p>
      </div>
    </Reveal>
  );
}
