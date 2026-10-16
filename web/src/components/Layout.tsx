import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { EASE_OUT } from "../lib/motion";
import { useTheme } from "../lib/theme";
import { DEMO_REPORT_ID, ZERO_DEMO_REPORT_ID } from "@mentioned/shared/fixtures";
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from "./Icons";

const NAV = [
  { to: "/#how", label: "How it works" },
  { to: "/#report-contents", label: "What you get" },
  { to: "/#sample", label: "Sample report" },
  { to: "/#faq", label: "FAQ" },
];

export function Wordmark() {
  return (
    <Link to="/" className="wordmark inline-flex items-baseline" aria-label="Mentioned, home">
      <span className="font-display text-[1.5rem] leading-none text-ink">
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

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location]);

  return (
    <header className="no-print relative z-30 border-b border-line bg-bg">
      <Container className="flex h-8 items-center justify-between gap-2">
        <Wordmark />
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex gap-3">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="link-draw py-0.5 text-sm text-ink-2 hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
            className="grid size-5 place-items-center text-[20px] text-ink md:hidden"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-menu"
            aria-label="Main"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="absolute inset-x-0 top-full overflow-hidden border-b border-ink bg-bg md:hidden"
          >
            <Container className="py-2">
              <ul>
                {NAV.map((item, i) => (
                  <motion.li
                    key={item.to}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                    className="border-b border-line"
                  >
                    <Link to={item.to} className="block py-1.5 font-display text-2xl text-ink">
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </Container>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-10 border-t-2 border-rule">
      <Container className="grid gap-4 py-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <Wordmark />
          <p className="mt-1.5 max-w-[36ch] text-sm text-ink-2">
            See whether AI assistants recommend your brand when shoppers ask what to buy.
          </p>
        </div>
        <nav aria-label="Product">
          <p className="text-sm font-semibold text-ink">Product</p>
          <ul className="mt-1 grid gap-0.5 text-sm">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="link-draw text-ink-2 hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Examples">
          <p className="text-sm font-semibold text-ink">Examples</p>
          <ul className="mt-1 grid gap-0.5 text-sm">
            <li>
              <Link to={`/report/${DEMO_REPORT_ID}`} className="link-draw text-ink-2 hover:text-ink">
                A brand that scored 41
              </Link>
            </li>
            <li>
              <Link to={`/report/${ZERO_DEMO_REPORT_ID}`} className="link-draw text-ink-2 hover:text-ink">
                A brand that scored 0
              </Link>
            </li>
          </ul>
        </nav>
      </Container>
      <Container className="flex flex-col gap-0.5 border-t border-line py-2 text-xs text-ink-3 sm:flex-row sm:justify-between">
        <span>Results come from AI model APIs and change over time.</span>
        <span>Made in India</span>
      </Container>
    </footer>
  );
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
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
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
