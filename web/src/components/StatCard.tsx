import type { ReactNode } from "react";
import { Reveal } from "./Section";

type Props = {
  label: string;
  value: ReactNode;
  caption: ReactNode;
  icon?: ReactNode;
};

/** One figure in a ruled row of figures. Lay several out in a grid with dividers. */
export function StatCard({ label, value, caption, icon }: Props) {
  return (
    <Reveal className="flex h-full flex-col py-2 md:px-3 md:first:pl-0">
      <h3 className="flex items-center gap-0.5 text-sm font-semibold text-ink">
        {label}
        {icon && <span className="text-[18px] text-ink-2">{icon}</span>}
      </h3>
      <div className="mt-1 font-display text-figure text-ink">{value}</div>
      <p className="mt-1 max-w-[34ch] text-sm text-ink-2">{caption}</p>
    </Reveal>
  );
}
