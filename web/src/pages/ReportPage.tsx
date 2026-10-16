import { motion } from "framer-motion";
import { useCallback, useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { useLocation, useParams } from "react-router-dom";
import { DEMO_REPORT_ID } from "@mentioned/shared/fixtures";
import type { Report } from "@mentioned/shared";
import { Button, ButtonLink } from "../components/Button";
import { Descriptors } from "../components/Descriptors";
import { FixCard } from "../components/FixCard";
import { AlertIcon, SearchOffIcon } from "../components/Icons";
import { IntentGrid } from "../components/IntentGrid";
import { Container, PageTransition } from "../components/Layout";
import { Methodology } from "../components/Methodology";
import { ModelBars } from "../components/ModelBars";
import { QueryAccordion } from "../components/QueryAccordion";
import { ReportHero } from "../components/ReportHero";
import { ReportSkeleton } from "../components/ReportSkeleton";
import { ShareOfVoice, shareOfVoiceSummary } from "../components/ShareOfVoice";
import { StateMessage } from "../components/StateMessage";
import { ReportNotFoundError, getReport } from "../lib/api";
import { EASE_OUT } from "../lib/motion";
import { usePrinting } from "../lib/usePrinting";
import { useDoneFixes } from "../lib/useDoneFixes";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; report: Report }
  | { status: "not-found" }
  | { status: "error"; message: string };

function useReport(id: string) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    getReport(id, controller.signal)
      .then((report) => setState({ status: "ready", report }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ReportNotFoundError) setState({ status: "not-found" });
        else setState({ status: "error", message: err instanceof Error ? err.message : "Something went wrong." });
      });
    return () => controller.abort();
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}

export function ReportPage() {
  const { id = "" } = useParams();
  const { state, retry } = useReport(id);
  const sampleFor = (useLocation().state as { sampleFor?: string } | null)?.sampleFor;

  useEffect(() => {
    if (state.status === "ready") document.title = `${state.report.brand}: AI visibility report · Mentioned`;
  }, [state]);

  return (
    <PageTransition>
      <Container>
        {state.status === "loading" && <ReportSkeleton />}

        {state.status === "not-found" && (
          <StateMessage
            role="status"
            icon={<SearchOffIcon />}
            title="We couldn't find that report"
            actions={
              <>
                <ButtonLink to="/">Check a brand</ButtonLink>
                <ButtonLink to={`/report/${DEMO_REPORT_ID}`} variant="secondary">
                  See a sample report
                </ButtonLink>
              </>
            }
          >
            The link may be mistyped, or the report may have been removed.
          </StateMessage>
        )}

        {state.status === "error" && (
          <StateMessage
            role="alert"
            icon={<AlertIcon />}
            title="This report didn't load"
            actions={
              <>
                <Button onClick={retry}>Try again</Button>
                <ButtonLink to="/" variant="secondary">
                  Back to start
                </ButtonLink>
              </>
            }
          >
            <p>We couldn't fetch it this time. Check your connection and try again.</p>
            <p className="mt-1 text-sm text-ink-3">Details: {state.message}</p>
          </StateMessage>
        )}

        {state.status === "ready" && <ReportBody report={state.report} sampleFor={sampleFor} />}
      </Container>
    </PageTransition>
  );
}

function SampleBanner({ brand }: { brand: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="no-print mt-2 border-l-4 border-accent bg-surface py-1 pl-2 pr-1 text-sm text-ink-2"
      role="note"
    >
      <span className="font-medium text-ink">Demo data.</span> Real checks for {brand} run once the server has a Gemini
      API key.
    </motion.p>
  );
}

type TabId = "overview" | "competitors" | "answers" | "fixes";
const TAB_IDS: TabId[] = ["overview", "competitors", "answers", "fixes"];
const tabFromHash = (): TabId | null => {
  const h = window.location.hash.slice(1) as TabId;
  return TAB_IDS.includes(h) ? h : null;
};

function ReportBody({ report, sampleFor }: { report: Report; sampleFor?: string }) {
  const discovery = report.queries.filter((q) => q.type === "discovery");
  const discoveryAnswers = discovery.reduce((n, q) => n + q.results.length, 0);
  const competitors = report.shareOfVoice.filter((s) => !s.isBrand).map((s) => s.name);
  const isZero = report.score === 0;
  const { done, toggle } = useDoneFixes(report.id);
  const printing = usePrinting();
  const baseId = useId();

  // A score of 0 opens on who's recommended instead; otherwise on the overview.
  const [tab, setTab] = useState<TabId>(() => tabFromHash() ?? (isZero ? "competitors" : "overview"));
  const [focus, setFocus] = useState<{ id: number; n: number } | null>(null);

  const choose = (t: TabId) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };
  const openQuestion = (id: number) => {
    choose("answers");
    setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 }));
  };

  // Link each intent to its discovery question so the intent list can jump to it.
  const intents = report.intents.map((intent) => ({
    ...intent,
    queryId: discovery.find((q) => q.intent === intent.label)?.id,
  }));

  const tabs: { id: TabId; label: string; count?: number; content: ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <Panel title="By AI model" hint="Click a model to see which questions">
            <ModelBars models={report.models} discovery={discovery} />
          </Panel>
          <Panel title="By shopper intent" hint="Click one to read its answers">
            <IntentGrid intents={intents} onOpenQuestion={openQuestion} />
          </Panel>
        </div>
      ),
    },
    {
      id: "competitors",
      label: "Competitors",
      content: (
        <div className="grid gap-6">
          <Panel title={isZero ? "Who AI recommends instead" : "Share of voice"} hint={shareOfVoiceSummary(report.shareOfVoice, discoveryAnswers)}>
            <ShareOfVoice data={report.shareOfVoice} totalAnswers={discoveryAnswers} discovery={discovery} />
          </Panel>
          <Panel title="How AI describes you">
            <Descriptors items={report.descriptors} brand={report.brand} />
          </Panel>
        </div>
      ),
    },
    {
      id: "answers",
      label: "Answers",
      count: report.queries.length,
      content: <QueryAccordion queries={report.queries} brand={report.brand} competitors={competitors} focus={focus} />,
    },
    {
      id: "fixes",
      label: "Fixes",
      count: report.fixes.length,
      content: (
        <Panel title={isZero ? "Where to start" : "What to fix first"} hint={done.size ? `${done.size} of ${report.fixes.length} done` : "Tick them off as you go"}>
          <ol className="border-t border-line">
            {report.fixes.map((fix, i) => (
              <FixCard key={fix.title} fix={fix} index={i} done={done.has(i)} onToggle={() => toggle(i)} />
            ))}
          </ol>
        </Panel>
      ),
    },
  ];

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TAB_IDS.indexOf(tab);
    const next = e.key === "ArrowRight" ? (i + 1) % 4 : e.key === "ArrowLeft" ? (i + 3) % 4 : e.key === "Home" ? 0 : e.key === "End" ? 3 : -1;
    if (next < 0) return;
    e.preventDefault();
    choose(TAB_IDS[next]);
    document.getElementById(`${baseId}-tab-${TAB_IDS[next]}`)?.focus();
  };

  return (
    <article>
      {sampleFor && <SampleBanner brand={sampleFor} />}
      <ReportHero report={report} />

      <div
        role="tablist"
        aria-label="Report sections"
        onKeyDown={onTabKey}
        className="no-print sticky top-0 z-30 -mx-2 flex gap-2 overflow-x-auto border-b border-line bg-bg px-2 [scrollbar-width:none] sm:-mx-4 sm:gap-3 sm:px-4"
      >
        {tabs.map((t) => {
          const selected = t.id === tab;
          return (
            <button
              key={t.id}
              id={`${baseId}-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => choose(t.id)}
              className={`relative shrink-0 py-2 text-sm transition-colors ${selected ? "font-semibold text-ink" : "text-ink-2 hover:text-ink"}`}
            >
              {t.label}
              {t.count !== undefined && <span className="tabular ml-0.5 text-ink-3">{t.count}</span>}
              {selected && (
                <motion.span layoutId={`${baseId}-tab-line`} className="absolute inset-x-0 -bottom-px h-[2px] bg-ink" transition={{ duration: 0.3, ease: EASE_OUT }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Printing (Download as PDF) shows every tab, one after another. */}
      {tabs.map((t) =>
        printing || t.id === tab ? (
          <motion.section
            key={t.id}
            id={`${baseId}-panel-${t.id}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${t.id}`}
            tabIndex={0}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="pt-4 focus:outline-none"
          >
            {printing && <h2 className="mb-2 font-display text-display-sm text-ink">{t.label}</h2>}
            {t.content}
          </motion.section>
        ) : null,
      )}

      <Methodology questionCount={report.queries.length} models={report.models.map((m) => m.name)} />
    </article>
  );
}

/** A titled block inside a tab: a small heading and an optional one-line hint. */
function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <h2 className="font-display text-title-lg text-ink">{title}</h2>
        {hint && <p className="text-sm text-ink-3">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
