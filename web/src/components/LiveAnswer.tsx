import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { highlightNames } from "../lib/highlight";
import { EASE_OUT } from "../lib/motion";
import { DEMO_REPORT_ID } from "@mentioned/shared/fixtures";
import { EXAMPLES as examples } from "../content/examples";
import { MentionedIcon, MissingIcon } from "./Icons";

const TYPE_MS = 26; // per character of the question
const STREAM_MS = 55; // per word of the answer
const HOLD_MS = 3400; // pause on a finished answer before moving on

/**
 * Landing-page demo: a shopper question types itself out, then each model's answer
 * streams in and the brand gets highlighted as it appears. Click a model to replay it.
 */
export function LiveAnswer() {
  const reduce = useReducedMotion();
  const baseId = useId();
  const [qi, setQi] = useState(0);
  const [mi, setMi] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [typed, setTyped] = useState(0);
  const [streamed, setStreamed] = useState(0);

  const q = examples[qi];
  const r = q.answers[mi];
  const named = r.position !== null;
  const tokens = useMemo(() => r.excerpt.split(/(\s+)/), [r]);

  const questionDone = reduce || typed >= q.question.length;
  const answerDone = reduce || streamed >= tokens.length;

  useEffect(() => {
    if (reduce || typed >= q.question.length) return;
    const t = setTimeout(() => setTyped((n) => n + 1), TYPE_MS);
    return () => clearTimeout(t);
  }, [typed, q, reduce]);

  useEffect(() => {
    if (reduce || !questionDone || streamed >= tokens.length) return;
    const t = setTimeout(() => setStreamed((n) => n + 2), STREAM_MS); // a word and its space
    return () => clearTimeout(t);
  }, [streamed, tokens, questionDone, reduce]);

  useEffect(() => {
    if (reduce || !playing || !answerDone) return;
    const t = setTimeout(() => {
      if (mi < q.answers.length - 1) {
        setMi(mi + 1);
        setStreamed(0);
      } else {
        nextQuestion();
      }
    }, HOLD_MS);
    return () => clearTimeout(t);
  });

  function nextQuestion() {
    setQi((n) => (n + 1) % examples.length);
    setMi(0);
    setTyped(0);
    setStreamed(0);
  }

  const pickModel = (i: number) => {
    setPlaying(false);
    setMi(i);
    setStreamed(0);
  };

  const shownQuestion = reduce ? q.question : q.question.slice(0, typed);
  const shownAnswer = reduce ? r.excerpt : tokens.slice(0, streamed).join("");
  const panelId = `${baseId}-panel`;

  return (
    <section aria-label="Example: how AI models answer a shopper" className="panel p-2 sm:p-3">
      <div className="flex items-center justify-between gap-1">
        <p className="text-sm font-semibold text-ink">A shopper asks</p>
        <div className="no-print flex items-center gap-1.5 text-xs">
          <button type="button" onClick={() => setPlaying((p) => !p)} className="text-ink-2 underline underline-offset-4 hover:text-ink">
            {playing ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={nextQuestion} className="text-ink-2 underline underline-offset-4 hover:text-ink">
            Next question
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={q.category}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-1.5 text-xs text-ink-3"
        >
          {q.category} · brand: <span className="font-medium text-ink-2">{q.brand}</span>
        </motion.p>
      </AnimatePresence>
      <p className="mt-0.5 min-h-[3.4em] font-display text-title-lg font-normal text-ink">
        <span aria-hidden="true">
          “{shownQuestion}
          {questionDone ? "”" : <span className="caret" />}
        </span>
        <span className="sr-only">{q.question}</span>
      </p>

      <div role="tablist" aria-label="AI model" className="mt-2 flex border-b border-ink">
        {q.answers.map((res, i) => {
          const selected = i === mi;
          return (
            <button
              key={res.model}
              id={`${baseId}-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={panelId}
              onClick={() => pickModel(i)}
              className={`relative -mb-px flex items-center gap-0.5 px-1.5 py-1 text-sm transition-colors ${
                selected ? "font-semibold text-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              {res.position !== null ? <MentionedIcon className="text-[13px]" /> : <MissingIcon className="text-[13px]" />}
              {res.model}
              {selected && (
                <motion.span layoutId={`${baseId}-tab-line`} className="absolute inset-x-0 -bottom-px h-[3px] bg-ink" transition={{ duration: 0.3, ease: EASE_OUT }} />
              )}
            </button>
          );
        })}
      </div>

      <div id={panelId} role="tabpanel" aria-labelledby={`${baseId}-tab-${mi}`} className="pt-2">
        <p className="min-h-[7.2em] text-base leading-[1.65] text-ink-2">
          <span aria-hidden="true">
            {highlightNames(shownAnswer, q.brand, q.competitors)}
            {questionDone && !answerDone && <span className="caret" />}
          </span>
          <span className="sr-only">{r.excerpt}</span>
        </p>
        <div className="mt-1.5 flex min-h-3 items-center justify-between gap-1 border-t border-line pt-1.5">
          <AnimatePresence mode="wait">
            {answerDone && (
              <motion.p
                key={`${qi}-${mi}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="inline-flex items-center gap-0.5 text-sm font-semibold text-ink"
              >
                {named ? <MentionedIcon /> : <MissingIcon />}
                {named ? `${r.model} named ${q.brand} #${r.position}` : `${r.model} didn't name ${q.brand}`}
              </motion.p>
            )}
          </AnimatePresence>
          <span className="tabular text-xs text-ink-3">
            {qi + 1}/{examples.length}
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs text-ink-3">
        Illustrative answers with made-up brands. See a{" "}
        <Link to={`/report/${DEMO_REPORT_ID}`} className="text-ink-2 underline underline-offset-2 hover:text-ink">
          full sample report
        </Link>
        .
      </p>
    </section>
  );
}
