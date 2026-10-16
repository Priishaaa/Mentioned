import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { rise } from "../lib/motion";

export function Reveal({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const Comp = as === "li" ? motion.li : motion.div;
  return (
    <Comp variants={rise} className={className}>
      {children}
    </Comp>
  );
}
