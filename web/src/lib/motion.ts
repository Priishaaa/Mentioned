import type { Transition, Variants } from "framer-motion";

export const EASE_OUT: Transition["ease"] = [0.16, 1, 0.3, 1];

/** Parent: staggers its children in as the section scrolls into view. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

/** Child: fades and rises into place. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const inViewOnce = { once: true, margin: "0px 0px -80px 0px" } as const;
