/** A quiet, collapsed note on how the numbers were made. Open by default when printed. */
export function Methodology({ questionCount, models }: { questionCount: number; models: string[] }) {
  return (
    <details className="group mt-6 border-t border-line pt-2 text-sm text-ink-2">
      <summary className="cursor-pointer list-none text-ink-3 hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="underline decoration-line-strong underline-offset-4">How this was measured</span>
      </summary>
      <div className="mt-1.5 grid max-w-[72ch] gap-1">
        <p>
          {questionCount} shopper questions were sent to {models.join(", ")} through their APIs. Most never name you, so
          they show whether AI recommends you unprompted. The score is mainly how often, and how early, you're named in
          those answers.
        </p>
        <p>API answers can differ from the assistants' own apps, and change over time. Treat this as a snapshot.</p>
      </div>
    </details>
  );
}
