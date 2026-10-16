import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { rise, stagger } from "../lib/motion";

type Props = { icon: ReactNode; title: string; children: ReactNode; actions?: ReactNode; role?: "alert" | "status" };

/** Full-page message for error, not-found and empty states. */
export function StateMessage({ icon, title, children, actions, role }: Props) {
  return (
    <motion.div
      role={role}
      initial="hidden"
      animate="show"
      variants={stagger}
      className="flex max-w-[600px] flex-col items-start py-8 sm:py-12"
    >
      <motion.span variants={rise} className="text-[28px] text-ink-2">
        {icon}
      </motion.span>
      <motion.h1 variants={rise} className="mt-4 font-display text-display-md text-ink">
        {title}
      </motion.h1>
      <motion.div variants={rise} className="mt-2 text-lg text-ink-2">
        {children}
      </motion.div>
      {actions && (
        <motion.div variants={rise} className="mt-4 flex flex-wrap gap-1">
          {actions}
        </motion.div>
      )}
    </motion.div>
  );
}
