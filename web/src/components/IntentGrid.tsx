import { openQuestion } from "../lib/events";
import type { IntentStatus, Report } from "@mentioned/shared";
import { ArrowRightIcon, MentionedIcon, MissingIcon, PartialIcon } from "./Icons";
import { Reveal } from "./Section";

const STATUS: Record<IntentStatus, { label: string; Icon: typeof MentionedIcon }> = {
  visible: { label: "Visible", Icon: MentionedIcon },
  partial: { label: "Partly visible", Icon: PartialIcon },
  invisible: { label: "Not visible", Icon: MissingIcon },
};

const ORDER: IntentStatus[] = ["visible", "partial", "invisible"];
const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Intent = Report["intents"][number] & { queryId?: number };

/** Shopper intents as a ruled checklist: mark + label + status in words. Click one to jump to its question. */
export function IntentGrid({ intents }: { intents: Intent[] }) {
  const sorted = [...intents].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  return (
    <div>
      <Reveal className="mb-2 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-ink-2">
        {ORDER.map((s) => {
          const { Icon, label } = STATUS[s];
          return (
            <span key={s} className="inline-flex items-center gap-0.5">
              <Icon className="text-[16px]" />
              <span className="tabular font-semibold text-ink">{intents.filter((i) => i.status === s).length}</span>
              {label.toLowerCase()}
            </span>
          );
        })}
      </Reveal>
      <ul className="grid border-t border-line sm:grid-cols-2 sm:gap-x-4">
        {sorted.map((intent) => {
          const { Icon, label } = STATUS[intent.status];
          return (
            <Reveal as="li" key={intent.label} className="border-b border-line">
              <button
                type="button"
                disabled={intent.queryId === undefined}
                onClick={() => intent.queryId !== undefined && openQuestion(intent.queryId)}
                className="group flex w-full items-center gap-1.5 py-1.5 text-left transition-colors hover:bg-surface disabled:hover:bg-transparent"
              >
                <Icon className="shrink-0 text-[20px] transition-transform duration-200 group-hover:scale-110" />
                <span className={`flex-1 text-base ${intent.status === "invisible" ? "text-ink-2" : "font-medium text-ink"}`}>
                  {capitalise(intent.label)}
                </span>
                {/* Status and "See question" share one cell and cross-fade on hover/focus. */}
                <span className="grid justify-items-end text-sm">
                  <span className="text-ink-3 transition-opacity [grid-area:1/1] group-hover:opacity-0 group-focus-visible:opacity-0">
                    {label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center gap-0.5 font-medium text-ink opacity-0 transition-opacity [grid-area:1/1] group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    See question <ArrowRightIcon />
                  </span>
                </span>
                <span className="sr-only">. Show this question</span>
              </button>
            </Reveal>
          );
        })}
      </ul>
    </div>
  );
}
