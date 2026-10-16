import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { inViewOnce, rise, stagger } from "../lib/motion";
import type { Report } from "@mentioned/shared";
import { ArrowRightIcon, MentionedIcon, MissingIcon } from "./Icons";

const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Item({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <motion.div variants={rise} className="py-2 md:px-3 md:first:pl-0 md:last:pr-0">
      <dt className="flex items-center gap-0.5 text-sm font-semibold text-ink">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-xl font-normal leading-snug text-ink">{children}</dd>
    </motion.div>
  );
}

/** The report in four lines: strengths, gaps, who's ahead, and where to start. */
export function KeyTakeaways({ report }: { report: Report }) {
  const visible = report.intents.filter((i) => i.status === "visible").map((i) => i.label);
  const partial = report.intents.filter((i) => i.status === "partial").map((i) => i.label);
  const missing = report.intents.filter((i) => i.status === "invisible").map((i) => i.label);
  const brand = report.shareOfVoice.find((s) => s.isBrand);
  const ahead = report.shareOfVoice
    .filter((s) => !s.isBrand && s.mentions > (brand?.mentions ?? 0))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 2);
  const strongest = visible.length ? visible : partial;

  return (
    <motion.section
      aria-label="At a glance"
      initial="hidden"
      whileInView="show"
      viewport={inViewOnce}
      variants={stagger}
      className="mb-8 border-y-2 border-rule"
    >
      <dl className="grid md:grid-cols-4 md:divide-x md:divide-line max-md:divide-y max-md:divide-line">
        <Item label="Strongest" icon={strongest.length ? <MentionedIcon className="text-[14px]" /> : undefined}>
          {strongest.length ? capitalise(list(strongest)) : "Nowhere yet"}
        </Item>
        <Item label="Missing from" icon={<MissingIcon className="text-[14px]" />}>
          {missing.length === 0
            ? "Nothing. You show up everywhere"
            : missing.length > 3
              ? `${capitalise(missing.slice(0, 3).join(", "))} and ${missing.length - 3} more`
              : capitalise(list(missing))}
        </Item>
        <Item label="Ahead of you">
          {ahead.length ? list(ahead.map((a) => `${a.name} (${a.mentions})`)) : "Nobody. You're named most"}
        </Item>
        <Item label="Start with">
          <a href="#fixes" className="group inline">
            <span className="link-draw">{report.fixes[0]?.title}</span>{" "}
            <ArrowRightIcon className="inline text-[16px] transition-transform group-hover:translate-x-0.5" />
          </a>
        </Item>
      </dl>
    </motion.section>
  );
}
