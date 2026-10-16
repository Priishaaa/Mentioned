import { TICKER_QUESTIONS as QUESTIONS } from "../content/examples";

/** A slow news-ticker of questions shoppers ask AI. Decorative; pauses on hover. */
export function QuestionTicker() {
  const items = [...QUESTIONS, ...QUESTIONS]; // doubled so the loop is seamless
  return (
    <div className="ticker relative -mx-2 overflow-hidden border-y border-ink bg-surface sm:-mx-4" aria-hidden="true">
      <div className="ticker-mask overflow-hidden">
      <div className="ticker-track py-1.5">
        {items.map((text, i) => (
          <span key={i} className="flex shrink-0 items-center">
            <span className="whitespace-nowrap px-2 font-display text-lg font-normal italic text-ink">{text}</span>
            <span className="size-1 shrink-0 bg-ink" />
          </span>
        ))}
      </div>
      </div>
    </div>
  );
}
