import { Reveal } from "./Section";

/** Short phrases AI models used about the brand, quoted as they appeared. */
export function Descriptors({ items, brand }: { items: string[]; brand: string }) {
  if (items.length === 0) {
    return (
      <Reveal className="border-l-2 border-line-strong pl-2">
        <p className="font-display text-display-sm font-normal text-ink">Nothing to quote yet.</p>
        <p className="mt-1 max-w-[60ch] text-base text-ink-2">
          None of the AI models described {brand}, because none of them recommended it. Once they start naming you, the
          words they use will show up here.
        </p>
      </Reveal>
    );
  }
  return (
    <ul className="grid border-t border-line md:grid-cols-2 md:gap-x-4">
      {items.map((d) => (
        <Reveal as="li" key={d} className="border-b border-line py-1.5">
          <q className="font-display text-title-lg font-normal italic text-ink">{d}</q>
        </Reveal>
      ))}
    </ul>
  );
}
