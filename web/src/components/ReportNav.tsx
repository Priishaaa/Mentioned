import { AnimatePresence, motion, useScroll } from "framer-motion";
import { useEffect, useState, type RefObject } from "react";
import { EASE_OUT } from "../lib/motion";
import { Container } from "./Layout";

type Props = {
  brand: string;
  score: number;
  sections: { id: string; label: string }[];
  /** When this element scrolls out of view, the bar slides in. */
  heroRef: RefObject<HTMLElement | null>;
};

/** Sticky bar with the brand, its score and section links that follow your scroll position. */
export function ReportNav({ brand, score, sections, heroRef }: Props) {
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const io = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting), { rootMargin: "-64px 0px 0px 0px" });
    io.observe(hero);
    return () => io.disconnect();
  }, [heroRef]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [sections]);

  return (
    <AnimatePresence>
      {shown && (
        <motion.nav
          aria-label="Report sections"
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="no-print fixed inset-x-0 top-0 z-40 border-b border-ink bg-bg"
        >
          <Container className="flex h-7 items-center gap-3">
            <a href="#main" className="flex shrink-0 items-baseline gap-1" aria-label={`${brand}, score ${score}. Back to top`}>
              <span className="max-w-[40vw] truncate font-display text-lg text-ink sm:max-w-none">{brand}</span>
              <span className="mark-under tabular font-display text-lg text-ink">{score}</span>
            </a>
            <ul className="-mr-2 flex flex-1 gap-2 overflow-x-auto pr-3 [scrollbar-width:none] [mask-image:linear-gradient(90deg,#000_80%,transparent)] sm:justify-end sm:[mask-image:none]">
              {sections.map((s) => (
                <li key={s.id} className="shrink-0">
                  <a
                    href={`#${s.id}`}
                    aria-current={active === s.id ? "location" : undefined}
                    className={`relative block py-2 text-sm transition-colors ${active === s.id ? "font-semibold text-ink" : "text-ink-2 hover:text-ink"}`}
                  >
                    {s.label}
                    {active === s.id && (
                      <motion.span layoutId="report-nav-active" className="absolute inset-x-0 bottom-0 h-[3px] bg-ink" transition={{ duration: 0.3, ease: EASE_OUT }} />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </Container>
          {/* Reading progress through the whole report. */}
          <motion.div aria-hidden="true" className="absolute inset-x-0 -bottom-px h-[3px] origin-left bg-ink" style={{ scaleX: scrollYProgress }} />
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
