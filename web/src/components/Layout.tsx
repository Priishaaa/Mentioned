import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { DEMO_REPORT_ID } from "@mentioned/shared/fixtures";
import { EASE_OUT } from "../lib/motion";
import { useTheme } from "../lib/theme";
import { MoonIcon, SunIcon } from "./Icons";

export function Wordmark() {
  return (
    <Link to="/" className="wordmark inline-flex items-baseline" aria-label="Mentioned, home">
      <span className="font-display text-[1.375rem] leading-none text-ink">
        <span className="mark-under">Mentioned</span>
      </span>
    </Link>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      className="no-print grid size-5 place-items-center text-[18px] text-ink-2 transition-colors hover:text-ink"
    >
      <motion.span key={theme} initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </motion.span>
    </button>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1100px] px-2 sm:px-4 ${className}`}>{children}</div>;
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-ink focus:px-2 focus:py-1 focus:text-sm focus:text-bg"
      >
        Skip to content
      </a>
      <header className="no-print">
        <Container className="flex h-8 items-center justify-between">
          <Wordmark />
          <nav aria-label="Main" className="flex items-center gap-2">
            <Link to={`/report/${DEMO_REPORT_ID}`} className="link-draw text-sm text-ink-2 hover:text-ink">
              Sample report
            </Link>
            <ThemeToggle />
          </nav>
        </Container>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="no-print mt-10 border-t border-line">
        <Container className="flex flex-col gap-0.5 py-3 text-xs text-ink-3 sm:flex-row sm:justify-between">
          <span>Mentioned · Made in India</span>
          <span>Results come from AI model APIs and change over time.</span>
        </Container>
      </footer>
    </div>
  );
}

/** Wraps each route so page changes cross-fade. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }}>
      {children}
    </motion.div>
  );
}
