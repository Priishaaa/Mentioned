import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { inViewOnce, rise, stagger } from "../lib/motion";

type Props = {
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** A report section under a heavy rule: title on the left, a short explanation beside it. */
export function Section({ id, title, description, children, className = "" }: Props) {
  const headingId = `${id}-title`;
  return (
    <motion.section
      id={id}
      aria-labelledby={headingId}
      initial="hidden"
      whileInView="show"
      viewport={inViewOnce}
      variants={stagger}
      className={`border-t-2 border-rule pt-2 ${className}`}
    >
      <motion.header variants={rise} className="mb-4 grid gap-1 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-4">
        <h2 id={headingId} className="font-display text-display-sm text-ink">
          {title}
        </h2>
        {description && <p className="max-w-[62ch] text-base text-ink-2 md:pt-0.5">{description}</p>}
      </motion.header>
      {children}
    </motion.section>
  );
}

export function Reveal({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const Comp = as === "li" ? motion.li : motion.div;
  return (
    <Comp variants={rise} className={className}>
      {children}
    </Comp>
  );
}
