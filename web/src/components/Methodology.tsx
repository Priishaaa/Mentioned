import { Reveal } from "./Section";

export function Methodology({ questionCount, models }: { questionCount: number; models: string[] }) {
  return (
    <Reveal className="grid gap-1 border-t border-line pt-2 text-sm text-ink-2 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-4">
      <h2 className="text-sm font-semibold text-ink">How this was measured</h2>
      <div className="grid gap-1.5">
        <p>
          We wrote {questionCount} questions a real shopper might ask and sent each one to {models.join(", ")} through
          their APIs. Discovery questions never name your brand, so they show whether AI recommends you unprompted. The
          score is based mainly on how often you're named in those answers, and how early.
        </p>
        <p>
          API answers can differ from the assistants' own apps, which may search the web or remember the user.
          AI answers also change over time and between runs, so treat this as a snapshot and check again after you make
          changes.
        </p>
      </div>
    </Reveal>
  );
}
