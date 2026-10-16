import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { pad2 } from "../lib/format";
import { EASE_OUT } from "../lib/motion";
import type { PipelineStep, QueryType } from "@mentioned/shared";
import { Button } from "./Button";
import { TypeBadge } from "./TypeBadge";

export type StepState = "pending" | "active" | "done";
export type StreamedQuestion = { id: number; queryType: QueryType; text: string };

type Props = {
  brand: string;
  steps: Record<PipelineStep, StepState>;
  progress: Partial<Record<PipelineStep, { done: number; total: number }>>;
  questions: StreamedQuestion[];
  questionCount: number;
  models: string[];
  onCancel: () => void;
};

const ORDER: PipelineStep[] = ["questions", "asking", "reading", "scoring"];

function useElapsed() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setS((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return `${Math.floor(s / 60)}:${pad2(s % 60)}`;
}

function StepMarker({ state }: { state: StepState }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative grid size-4 shrink-0 place-items-center" aria-hidden="true">
      {state === "pending" && <span className="size-2 border border-line-strong" />}
      {state === "active" && (
        <>
          {!reduce && (
            <motion.span
              className="absolute size-2 bg-ink"
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <span className="relative size-2 border border-ink" />
        </>
      )}
      {state === "done" && (
        <motion.span
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className="grid size-2 place-items-center bg-ink text-bg"
        >
          <svg viewBox="0 0 24 24" className="size-1.5" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="square">
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.05 }} />
          </svg>
        </motion.span>
      )}
    </span>
  );
}

/**
 * One cell per answer (rows = models, columns = questions). Cells fill grey as
 * answers arrive and turn ink once they've been read.
 */
function AnswerGrid({ models, questionCount, asked, read }: { models: string[]; questionCount: number; asked: number; read: number }) {
  return (
    <figure className="mt-3 border-t border-line pt-2" aria-label={`${asked} answers received, ${read} read`}>
      <figcaption className="mb-1 flex justify-between text-xs text-ink-3">
        <span>Answers</span>
        <span className="tabular">
          {read > 0 ? `${read} read` : `${asked} received`}
        </span>
      </figcaption>
      <div className="grid gap-0.5" aria-hidden="true">
        {models.map((model, m) => (
          <div key={model} className="grid items-center gap-0.5" style={{ gridTemplateColumns: `64px repeat(${questionCount}, minmax(0, 1fr))` }}>
            <span className="text-xs text-ink-2">{model}</span>
            {Array.from({ length: questionCount }, (_, q) => {
              // Answers come in question by question, each asked to every model.
              const k = q * models.length + m;
              const state = k < read ? "read" : k < asked ? "asked" : "empty";
              return (
                <span
                  key={q}
                  className={`aspect-square transition-[transform,background-color,border-color] duration-200 ${
                    state === "read"
                      ? "scale-100 border border-ink bg-ink"
                      : state === "asked"
                        ? "scale-100 border border-rival-strong bg-rival"
                        : "scale-75 border border-line-strong"
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </figure>
  );
}

/** The report being built, step by step, with questions streaming in. */
export function PipelineLoader({ brand, steps, progress, questions, questionCount, models, onCancel }: Props) {
  const elapsed = useElapsed();
  const modelCount = models.length;
  const answers = questionCount * modelCount;
  const labels: Record<PipelineStep, string> = {
    questions: `Writing ${questionCount} shopper questions`,
    asking: modelCount === 1 ? `Asking ${models[0]}` : `Asking ${modelCount} AI models`,
    reading: `Reading ${answers} answers`,
    scoring: "Scoring your visibility",
  };
  const activeStep = ORDER.find((s) => steps[s] === "active");

  return (
    <div className="grid gap-5 pb-8 pt-5 sm:pt-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
      <div className="lg:sticky lg:top-12 lg:self-start">
        <p className="text-sm font-semibold text-ink">Checking</p>
        <h1 className="mt-1 break-words font-display text-display-md text-ink">{brand}</h1>
        <p className="mt-2 text-base text-ink-2">
          This usually takes 30 to 60 seconds. <span className="tabular text-ink-3">({elapsed})</span>
        </p>

        <p className="sr-only" aria-live="polite">
          {activeStep ? `${labels[activeStep]}…` : ""}
        </p>

        <ol className="mt-4 grid gap-0.5">
          {ORDER.map((step, i) => {
            const state = steps[step];
            const p = progress[step];
            return (
              <li key={step} className="relative flex gap-2 pb-2">
                {i < ORDER.length - 1 && (
                  <span aria-hidden="true" className="absolute left-[15px] top-[26px] h-[calc(100%-20px)] w-px overflow-hidden bg-line">
                    <motion.span
                      className="block h-full w-full origin-top bg-ink"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: state === "done" ? 1 : 0 }}
                      transition={{ duration: 0.5, ease: EASE_OUT }}
                    />
                  </span>
                )}
                <StepMarker state={state} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={`text-lg transition-colors duration-300 ${
                      state === "active" ? "font-medium text-ink" : state === "done" ? "text-ink-2" : "text-ink-3"
                    }`}
                  >
                    {labels[step]}
                    <span className="sr-only">{state === "done" ? " (done)" : state === "active" ? " (in progress)" : " (waiting)"}</span>
                  </p>
                  <AnimatePresence initial={false}>
                    {state === "active" && p && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 flex items-center gap-1.5">
                          <div className="h-0.5 flex-1 overflow-hidden bg-line">
                            <motion.div className="h-full origin-left bg-ink" animate={{ scaleX: p.done / p.total }} transition={{ duration: 0.2 }} />
                          </div>
                          <span className="tabular text-xs text-ink-3">
                            {p.done}/{p.total}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            );
          })}
        </ol>

        <AnswerGrid
          models={models}
          questionCount={questionCount}
          asked={progress.asking?.done ?? (steps.asking === "done" ? answers : 0)}
          read={progress.reading?.done ?? (steps.reading === "done" ? answers : 0)}
        />

        <Button variant="ghost" onClick={onCancel} className="mt-3">
          Cancel
        </Button>
      </div>

      <section aria-labelledby="streamed-title" className="border-t-2 border-rule pt-2">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <h2 id="streamed-title" className="font-display text-display-sm text-ink">
            The questions
          </h2>
          <span className="tabular text-sm text-ink-3">
            {questions.length}/{questionCount}
          </span>
        </div>
        <p className="mb-2 text-sm text-ink-2">What a shopper might ask an AI assistant before buying.</p>
        <ol className="grid">
          {Array.from({ length: questionCount }, (_, i) => {
            const q = questions[i];
            return (
              <li key={i} className="relative min-h-7 border-t border-line">
                <AnimatePresence mode="wait" initial={false}>
                  {q ? (
                    <motion.div
                      key="q"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, ease: EASE_OUT }}
                      className="flex gap-1.5 py-1.5"
                    >
                      <span className="tabular pt-0.5 text-xs text-ink-3">{pad2(q.id)}</span>
                      <div className="min-w-0">
                        <TypeBadge type={q.queryType} />
                        <p className="mt-0.5 font-display text-lg font-normal text-ink">{q.text}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="empty" exit={{ opacity: 0 }} className="flex items-center gap-1.5 py-2.5" aria-hidden="true">
                      <span className="tabular text-xs text-line-strong">{pad2(i + 1)}</span>
                      <span className={`h-1 bg-surface-sunk ${i % 3 === 0 ? "w-[70%]" : i % 3 === 1 ? "w-[55%]" : "w-[62%]"}`} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
