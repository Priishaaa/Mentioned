import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE_OUT } from "../lib/motion";

type Props = {
  value: number;
  decimals?: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  className?: string;
};

/** A number that counts up from 0 the first time it scrolls into view. */
export function CountUp({ value, decimals = 0, duration = 1.6, delay = 0, suffix = "", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    if (!inView) return;
    const controls = animate(0, value, { duration, delay, ease: EASE_OUT, onUpdate: setShown });
    return () => controls.stop();
  }, [inView, reduce, value, duration, delay]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true" className="tabular">
        {shown.toFixed(decimals)}
        {suffix}
      </span>
      <span className="sr-only">
        {value.toFixed(decimals)}
        {suffix}
      </span>
    </span>
  );
}
