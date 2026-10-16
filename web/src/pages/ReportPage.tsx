import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Button, ButtonLink } from "../components/Button";
import { Descriptors } from "../components/Descriptors";
import { FixCard } from "../components/FixCard";
import { AlertIcon, SearchOffIcon, SentimentIcon } from "../components/Icons";
import { IntentGrid } from "../components/IntentGrid";
import { KeyTakeaways } from "../components/KeyTakeaways";
import { Container, PageTransition } from "../components/Layout";
import { Methodology } from "../components/Methodology";
import { ModelBars } from "../components/ModelBars";
import { QueryAccordion } from "../components/QueryAccordion";
import { ReportActions } from "../components/ReportActions";
import { ReportNav } from "../components/ReportNav";
import { ReportSkeleton } from "../components/ReportSkeleton";
import { ScoreHero } from "../components/ScoreHero";
import { Section } from "../components/Section";
import { ShareOfVoice, shareOfVoiceSummary } from "../components/ShareOfVoice";
import { StatCard } from "../components/StatCard";
import { StateMessage } from "../components/StateMessage";
import { CountUp } from "../components/CountUp";
import { ReportNotFoundError, getReport } from "../lib/api";
import { ordinal } from "../lib/format";
import { useDoneFixes } from "../lib/useDoneFixes";
import { EASE_OUT } from "../lib/motion";
import { DEMO_REPORT_ID } from "@mentioned/shared/fixtures";
import type { Report } from "@mentioned/shared";

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
            The link may be mistyped, or the report may have been removed. Reports are kept for 90 days.
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
            <p>Your results are safe; we just couldn't fetch them this time. Check your connection and try again.</p>
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
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="no-print mt-3 border-l-4 border-accent bg-surface py-1 pl-2 pr-1 text-sm text-ink-2"
      role="note"
    >
      <span className="font-medium text-ink">Demo mode: this is sample data.</span> Real checks for {brand} run once the
      server has a Gemini API key (free).
    </motion.div>
  );
}

const SECTION_META: Record<string, { id: string; label: string }> = {
  breakdown: { id: "breakdown", label: "Breakdown" },
  models: { id: "models", label: "Models" },
  voice: { id: "share-of-voice", label: "Competitors" },
  intents: { id: "intents", label: "Intents" },
  queries: { id: "questions", label: "Questions" },
  descriptors: { id: "descriptions", label: "Descriptions" },
  fixes: { id: "fixes", label: "Fixes" },
};

const ORDER_DEFAULT = ["breakdown", "models", "voice", "intents", "queries", "descriptors", "fixes"];
// A score of 0 leads with who AI recommends instead and what to do about it.
const ORDER_ZERO = ["voice", "fixes", "breakdown", "intents", "models", "queries", "descriptors"];

function ReportBody({ report, sampleFor }: { report: Report; sampleFor?: string }) {
  const discovery = report.queries.filter((q) => q.type === "discovery");
  const discoveryAnswers = discovery.reduce((n, q) => n + q.results.length, 0);
  const competitors = report.shareOfVoice.filter((s) => !s.isBrand).map((s) => s.name);
  const modelNames = report.models.map((m) => m.name);
  const isZero = report.score === 0;
  const { stats } = report;
  const mentionCount = Math.round(stats.mentionRate * discoveryAnswers);
  const heroRef = useRef<HTMLDivElement>(null);
  const { done, toggle } = useDoneFixes(report.id);
  // Link each intent to its discovery question so the intent list can jump to it.
  const intents = report.intents.map((intent) => ({
    ...intent,
    queryId: discovery.find((q) => q.intent === intent.label)?.id,
  }));

  const sections: Record<string, () => ReactNode> = {
    breakdown: () => (
      <Section id="breakdown" title="Score breakdown" description="The three numbers behind your score.">
        <div className="grid border-y border-line md:grid-cols-3 md:divide-x md:divide-line max-md:divide-y max-md:divide-line">
          <StatCard
            label="Mention rate"
            value={<CountUp value={Math.round(stats.mentionRate * 100)} suffix="%" />}
            caption={`Named in ${mentionCount} of ${discoveryAnswers} answers to questions that don't name you.`}
          />
          <StatCard
            label="Average position"
            value={stats.avgPosition === null ? <span className="text-ink-3">n/a</span> : <CountUp value={stats.avgPosition} decimals={1} />}
            caption={
              stats.avgPosition === null
                ? "Not ranked: no model recommended you."
                : `Usually named ${ordinal(Math.round(stats.avgPosition))} when you're named at all. Lower is better.`
            }
          />
          <StatCard
            label="Sentiment"
            icon={<SentimentIcon sentiment={stats.sentiment} />}
            value={<span className="capitalize">{stats.sentiment}</span>}
            caption={
              isZero
                ? "Neutral by default: AI has nothing to say about you yet."
                : "Overall tone of what AI says when it describes you."
            }
          />
        </div>
      </Section>
    ),
    models: () => (
      <Section
        id="models"
        title="By AI model"
        description="How often each assistant named you when shoppers asked without mentioning you. Click a model to see which questions."
      >
        <ModelBars models={report.models} discovery={discovery} />
      </Section>
    ),
    voice: () => (
      <Section
        id="share-of-voice"
        title={isZero ? "Who AI recommends instead" : "Share of voice"}
        description={shareOfVoiceSummary(report.shareOfVoice, discoveryAnswers)}
      >
        <ShareOfVoice data={report.shareOfVoice} totalAnswers={discoveryAnswers} discovery={discovery} />
      </Section>
    ),
    intents: () => (
      <Section
        id="intents"
        title="Visibility by intent"
        description="Each discovery question tests a different reason to buy. This is where you show up, and where you don't. Click one to read the answers."
      >
        <IntentGrid intents={intents} />
      </Section>
    ),
    queries: () => (
      <Section
        id="questions"
        title="Question by question"
        description="Every question we asked, and what each AI model said. Open one to read the answers."
      >
        <QueryAccordion queries={report.queries} brand={report.brand} competitors={competitors} />
      </Section>
    ),
    descriptors: () => (
      <Section id="descriptions" title="How AI describes you" description="Phrases taken from the answers.">
        <Descriptors items={report.descriptors} brand={report.brand} />
      </Section>
    ),
    fixes: () => (
      <Section
        id="fixes"
        title={isZero ? "Where to start" : "Top 3 fixes"}
        description={
          done.size > 0
            ? `Ranked by how much each one should move your score. ${done.size} of ${report.fixes.length} done.`
            : "Ranked by how much each one should move your score. Tick them off as you go."
        }
      >
        <ol className="border-t border-ink">
          {report.fixes.map((fix, i) => (
            <FixCard key={fix.title} fix={fix} index={i} done={done.has(i)} onToggle={() => toggle(i)} />
          ))}
        </ol>
      </Section>
    ),
  };

  const order = isZero ? ORDER_ZERO : ORDER_DEFAULT;

  const navSections = useMemo(() => order.map((key) => SECTION_META[key]), [order]);

  return (
    <article>
      <ReportNav brand={report.brand} score={report.score} sections={navSections} heroRef={heroRef} />
      {sampleFor && <SampleBanner brand={sampleFor} />}
      <div ref={heroRef}>
        <ScoreHero report={report} modelCount={report.models.length} />
      </div>
      <KeyTakeaways report={report} />
      <div className="grid gap-8">
        {order.map((key) => (
          <div key={key}>{sections[key]()}</div>
        ))}
        <div className="grid gap-5">
          <ReportActions />
          <Methodology questionCount={report.queries.length} models={modelNames} />
        </div>
      </div>
    </article>
  );
}
