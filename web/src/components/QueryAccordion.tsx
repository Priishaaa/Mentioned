import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { QUERY_TYPE_LABEL, pad2 } from "../lib/format";
import { OPEN_QUESTION } from "../lib/events";
import { highlightNames } from "../lib/highlight";
import { EASE_OUT } from "../lib/motion";
import type { Query, QueryResult, QueryType } from "@mentioned/shared";
import { ChevronDownIcon, MentionedIcon, MissingIcon } from "./Icons";
import { Reveal } from "./Section";
import { TypeBadge } from "./TypeBadge";

type Props = { queries: Query[]; brand: string; competitors: string[] };
type Filter = "all" | QueryType;

/** Expands every panel while printing, so the PDF has all the answers. */
function usePrinting() {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const on = () => flushSync(() => setPrinting(true));
    const off = () => setPrinting(false);
    window.addEventListener("beforeprint", on);
    window.addEventListener("afterprint", off);
    return () => {
      window.removeEventListener("beforeprint", on);
      window.removeEventListener("afterprint", off);
    };
  }, []);
  return printing;
}

export function QueryAccordion({ queries, brand, competitors }: Props) {
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [flashId, setFlashId] = useState<number | null>(null);
  const printing = usePrinting();
  const baseId = useId();
  const reduce = useReducedMotion();

  // Other sections (e.g. the intent list) can ask for a question to be opened.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<number>).detail;
      flushSync(() => {
        setFilter("all");
        setOpen((prev) => new Set(prev).add(id));
      });
      const trigger = document.getElementById(`${baseId}-trigger-${id}`);
      trigger?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      trigger?.focus({ preventScroll: true });
      setFlashId(id);
    };
    window.addEventListener(OPEN_QUESTION, onOpen);
    return () => window.removeEventListener(OPEN_QUESTION, onOpen);
  }, [baseId, reduce]);

  useEffect(() => {
    if (flashId === null) return;
    const t = setTimeout(() => setFlashId(null), 1600);
    return () => clearTimeout(t);
  }, [flashId]);

  const visible = filter === "all" || printing ? queries : queries.filter((q) => q.type === filter);
  const filters: Filter[] = ["all", "discovery", "brand_check", "comparison"];

  const toggle = (id: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Arrow keys move between question headers (WAI-ARIA accordion pattern).
  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const triggers = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("[data-accordion-trigger]"));
    const i = triggers.indexOf(document.activeElement as HTMLButtonElement);
    if (i === -1) return;
    const target =
      e.key === "ArrowDown" ? triggers[(i + 1) % triggers.length]
      : e.key === "ArrowUp" ? triggers[(i - 1 + triggers.length) % triggers.length]
      : e.key === "Home" ? triggers[0]
      : e.key === "End" ? triggers[triggers.length - 1]
      : null;
    if (target) {
      e.preventDefault();
      target.focus();
    }
  };

  return (
    <div>
      <Reveal className="no-print mb-2 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
        <div role="group" aria-label="Filter questions by type" className="flex flex-wrap gap-x-2.5 gap-y-0.5">
          {filters.map((f) => {
            const count = f === "all" ? queries.length : queries.filter((q) => q.type === f).length;
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f)}
                className={`border-b-2 py-0.5 text-sm transition-colors ${
                  active ? "border-ink font-semibold text-ink" : "border-transparent text-ink-2 hover:text-ink"
                }`}
              >
                {f === "all" ? "All" : QUERY_TYPE_LABEL[f]} <span className="tabular text-ink-3">({count})</span>
              </button>
            );
          })}
        </div>
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-ink-2">
          Key: <mark className="hl-brand">{brand}</mark>
          <mark className="hl-rival">competitor</mark>
        </p>
      </Reveal>

      <ul className="border-t border-ink" onKeyDown={onKeyDown}>
        {visible.map((q) => {
          const isOpen = printing || open.has(q.id);
          const triggerId = `${baseId}-trigger-${q.id}`;
          const panelId = `${baseId}-panel-${q.id}`;
          return (
            <li key={q.id} className={`border-b border-line transition-colors duration-700 ${flashId === q.id ? "bg-accent-soft" : ""}`}>
              <h3>
                <button
                  id={triggerId}
                  type="button"
                  data-accordion-trigger
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(q.id)}
                  className="group relative grid w-full grid-cols-[32px_minmax(0,1fr)_20px] items-start gap-x-1.5 py-2 text-left transition-colors hover:bg-surface sm:grid-cols-[40px_minmax(0,1fr)_auto_20px] sm:items-center sm:gap-x-3"
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-0 -left-1 w-[3px] origin-top bg-ink transition-transform duration-200 ${
                      isOpen ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
                    }`}
                  />
                  <span className="tabular pt-0.5 text-sm text-ink-3 sm:pt-0">{pad2(q.id)}</span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-x-1">
                      <TypeBadge type={q.type} />
                      <span className="text-xs text-ink-3">/ {q.intent}</span>
                    </span>
                    <span className="mt-0.5 block font-display text-lg font-normal leading-snug text-ink sm:text-title">
                      {q.text}
                    </span>
                  </span>
                  <ModelStatuses results={q.results} className="col-start-2 row-start-2 mt-1 sm:col-start-3 sm:row-start-1 sm:mt-0" />
                  <ChevronDownIcon
                    className={`col-start-3 row-start-1 mt-0.5 text-[18px] text-ink-3 transition-transform duration-200 group-hover:text-ink sm:col-start-4 sm:mt-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </h3>
              {printing ? (
                <div id={panelId} role="region" aria-labelledby={triggerId}>
                  <Answers results={q.results} brand={brand} competitors={competitors} />
                </div>
              ) : (
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
                      <Answers results={q.results} brand={brand} competitors={competitors} />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ModelStatuses({ results, className = "" }: { results: QueryResult[]; className?: string }) {
  return (
    <span className={`flex flex-wrap gap-x-1.5 gap-y-0.5 ${className}`}>
      {results.map((r) => (
        <span key={r.model} className="inline-flex items-center gap-0.5 text-xs text-ink-2">
          {r.mentioned ? <MentionedIcon className="text-[14px]" /> : <MissingIcon className="text-[14px]" />}
          <span className={r.mentioned ? "font-semibold text-ink" : ""}>{r.model}</span>
          {r.mentioned && r.position !== null && <span className="tabular text-ink-3">#{r.position}</span>}
          <span className="sr-only">{r.mentioned ? `: mentioned${r.position ? ` at position ${r.position}` : ""}` : ": not mentioned"}</span>
        </span>
      ))}
    </span>
  );
}

function Answers({ results, brand, competitors }: { results: QueryResult[]; brand: string; competitors: string[] }) {
  return (
    <div className="grid pb-3 sm:pl-8 md:grid-cols-3 md:divide-x md:divide-line">
      {results.map((r) => (
        <AnswerCard key={r.model} result={r} brand={brand} competitors={competitors} />
      ))}
    </div>
  );
}

function AnswerCard({ result: r, brand, competitors }: { result: QueryResult; brand: string; competitors: string[] }) {
  const [full, setFull] = useState(false);
  const canExpand = Boolean(r.fullAnswer && r.fullAnswer.trim().length > r.excerpt.length + 40);
  return (
    <article className="flex flex-col border-t border-line py-2 md:border-t-0 md:px-2 md:first:pl-0 md:last:pr-0">
      <header className="mb-1 flex items-baseline justify-between gap-1">
        <h4 className="text-sm font-semibold text-ink">{r.model}</h4>
        <span className="text-xs text-ink-2">
          {r.mentioned ? (r.position ? `Named ${r.position === 1 ? "first" : `#${r.position}`}` : "Named") : "Not recommended"}
        </span>
      </header>
      {full && r.fullAnswer ? (
        <div className="max-h-[420px] flex-1 overflow-y-auto whitespace-pre-line pr-1 text-sm leading-[1.65] text-ink-2">
          {highlightNames(r.fullAnswer, brand, competitors)}
        </div>
      ) : (
        <blockquote className="flex-1 text-sm leading-[1.65] text-ink-2">“{highlightNames(r.excerpt, brand, competitors)}”</blockquote>
      )}
      {r.competitors.length > 0 && <p className="mt-1 text-xs text-ink-3">Also named: {r.competitors.join(", ")}</p>}
      {canExpand && (
        <button
          type="button"
          aria-expanded={full}
          onClick={() => setFull((f) => !f)}
          className="no-print mt-1 self-start text-xs font-medium text-ink underline underline-offset-4"
        >
          {full ? "Show the excerpt" : "Read the full answer"}
        </button>
      )}
    </article>
  );
}
