import { useInView, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** "hl-brand" for brand names in text, "mark-under" for a band under big type. */
  className?: string;
  /** ms to wait after coming into view before the stroke draws. */
  delay?: number;
};

/** A highlighter stroke that draws itself across its text the first time it scrolls into view. */
export function Mark({ children, className = "hl-brand", delay = 0 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  return (
    <mark
      ref={ref}
      data-sweep={reduce || inView ? "on" : "off"}
      style={delay ? { transitionDelay: `${delay}ms, ${delay + 150}ms` } : undefined}
      className={className}
    >
      {children}
    </mark>
  );
}
