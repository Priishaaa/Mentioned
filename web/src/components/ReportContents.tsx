import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { EASE_OUT, inViewOnce, rise, stagger } from "../lib/motion";
import { CheckIcon } from "./Icons";
import { Mark } from "./Mark";

function Cell({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <motion.li variants={rise} className="flex flex-col gap-2 p-2 transition-colors hover:bg-surface sm:p-3">
      <div aria-hidden="true" className="flex min-h-[72px] items-end sm:min-h-[120px]">
        {children}
      </div>
      <div>
        <h3 className="font-display text-xl text-ink">{title}</h3>
        <p className="mt-0.5 text-sm text-ink-2">{body}</p>
      </div>
    </motion.li>
  );
}

const BARS = [
  { name: "Softhaus", w: 100 },
  { name: "Cedarbloom", w: 85 },
  { name: "You", w: 46, you: true },
  { name: "Dewly", w: 38 },
];

/** Three fixes; the first ticks itself off shortly after scrolling into view. */
function MiniFixes() {
  const ref = useRef<HTMLUListElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  return (
    <ul ref={ref} className="grid w-full gap-1 text-sm">
      {["Get into review roundups", "Publish a durability page", "Answer the top complaint"].map((t, i) => {
        const ticked = i === 0 && inView;
        return (
          <li key={t} className="flex items-center gap-1">
            <span
              className={`grid size-2 shrink-0 place-items-center border border-ink transition-colors delay-700 duration-300 ${ticked ? "bg-ink" : ""}`}
            >
              <CheckIcon className={`text-[12px] text-bg transition-opacity delay-700 duration-300 ${ticked ? "opacity-100" : "opacity-0"}`} />
            </span>
            <span
              className={`line-through transition-[color,text-decoration-color] delay-700 duration-300 ${
                ticked ? "text-ink-3 decoration-ink-3" : "text-ink decoration-transparent"
              }`}
            >
              {t}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** "What's in your report": four working miniatures of the real report sections. */
export function ReportContents() {
  return (
    <motion.section
      id="report-contents"
      aria-labelledby="contents-title"
      initial="hidden"
      whileInView="show"
      viewport={inViewOnce}
      variants={stagger}
      className="border-t-2 border-rule pt-2"
    >
      <motion.div variants={rise} className="mb-4 grid gap-1 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-4">
        <h2 id="contents-title" className="font-display text-display-sm text-ink">
          What's in your report
        </h2>
        <p className="max-w-[60ch] text-base text-ink-2 md:pt-0.5">
          One page you can read in five minutes and share with your team, with the actual answers behind every number it
          shows.
        </p>
      </motion.div>

      <ul className="grid border border-ink sm:grid-cols-2 lg:grid-cols-4 [&>li]:border-line max-sm:[&>li+li]:border-t sm:max-lg:[&>li:nth-child(2n)]:border-l sm:max-lg:[&>li:nth-child(n+3)]:border-t lg:[&>li+li]:border-l">
        <Cell title="A visibility score" body="One number from 0 to 100, and a plain-English verdict on what it means.">
          <p className="flex items-end gap-1">
            <Mark className="mark-score font-display text-figure-lg tracking-[-0.04em] text-ink" delay={300}>
              41
            </Mark>
            <span className="mb-1 text-xs text-ink-3">/100</span>
          </p>
        </Cell>

        <Cell title="Who's named instead" body="How often each competitor comes up compared with you.">
          <ul className="grid w-full gap-1">
            {BARS.map((b, i) => (
              <li key={b.name} className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-1 text-xs">
                <span className={b.you ? "font-semibold text-ink" : "text-ink-2"}>{b.name}</span>
                <motion.span
                  className={`block h-1.5 origin-left ${b.you ? "bar-brand" : "bg-rival"}`}
                  style={{ width: `${b.w}%` }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={inViewOnce}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.08, ease: EASE_OUT }}
                />
              </li>
            ))}
          </ul>
        </Cell>

        <Cell title="Every answer, marked up" body="Read exactly what each model said, with your name and your rivals' picked out.">
          <p className="text-sm leading-[1.7] text-ink-2">
            “<mark className="hl-rival">Softhaus</mark> is the usual pick, and <Mark delay={400}>your brand</Mark> sells a
            vitamin C gel that gets good reviews.”
          </p>
        </Cell>

        <Cell title="Fixes, in order" body="Three specific things to do next, with the reason for each.">
          <MiniFixes />
        </Cell>
      </ul>
    </motion.section>
  );
}
