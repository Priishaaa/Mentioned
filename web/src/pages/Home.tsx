import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandForm } from "../components/BrandForm";
import { Button } from "../components/Button";
import { Faq } from "../components/Faq";
import { FinalCta } from "../components/FinalCta";
import { HowItWorks } from "../components/HowItWorks";
import { LiveAnswer } from "../components/LiveAnswer";
import { Mark } from "../components/Mark";
import { QuestionTicker } from "../components/QuestionTicker";
import { ReportContents } from "../components/ReportContents";
import { AlertIcon } from "../components/Icons";
import { Container, PageTransition } from "../components/Layout";
import { PipelineLoader, type StepState, type StreamedQuestion } from "../components/PipelineLoader";
import { SampleReportCard } from "../components/SampleReportCard";
import { WhyItMatters } from "../components/WhyItMatters";
import { StateMessage } from "../components/StateMessage";
import { ApiError, QUESTION_COUNT, createReport } from "../lib/api";
import { listModels, modelCountWords, useModels } from "../lib/models";
import { EASE_OUT, rise, stagger } from "../lib/motion";
import type { PipelineStep, ReportInput } from "@mentioned/shared";

type Phase = "form" | "running" | "error";

const INITIAL_STEPS: Record<PipelineStep, StepState> = {
  questions: "pending",
  asking: "pending",
  reading: "pending",
  scoring: "pending",
};

export function Home() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("form");
  const [input, setInput] = useState<ReportInput | null>(null);
  const [steps, setSteps] = useState(INITIAL_STEPS);
  const [progress, setProgress] = useState<Partial<Record<PipelineStep, { done: number; total: number }>>>({});
  const [questions, setQuestions] = useState<StreamedQuestion[]>([]);
  const models = useModels();
  const [run, setRun] = useState({ models, questionCount: QUESTION_COUNT });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.title = "Mentioned: is AI recommending your brand?";
    return () => controllerRef.current?.abort();
  }, []);

  const start = async (data: ReportInput) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setInput(data);
    setRun({ models, questionCount: QUESTION_COUNT });
    setSteps(INITIAL_STEPS);
    setProgress({});
    setQuestions([]);
    setPhase("running");
    window.scrollTo({ top: 0 });

    try {
      const { id, isSample } = await createReport(data, {
        signal: controller.signal,
        onStart: setRun,
        onEvent: (e) => {
          if (e.type === "step") setSteps((s) => ({ ...s, [e.step]: e.status }));
          else if (e.type === "progress") setProgress((p) => ({ ...p, [e.step]: { done: e.done, total: e.total } }));
          else if (e.type === "question")
            // After a reconnect the server replays its log, so skip questions we already have.
            setQuestions((q) => (q.some((x) => x.id === e.id) ? q : [...q, { id: e.id, queryType: e.queryType, text: e.text }]));
        },
      });
      navigate(`/report/${id}`, { state: isSample ? { sampleFor: data.brand } : undefined });
    } catch (e) {
      if (controller.signal.aborted) return;
      setErrorMessage(e instanceof ApiError ? e.message : null);
      setPhase("error");
    }
  };

  const cancel = () => {
    controllerRef.current?.abort();
    setPhase("form");
  };

  return (
    <PageTransition>
      <Container>
        <AnimatePresence mode="wait" initial={false}>
          {phase === "form" && (
            <motion.div key="form" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE_OUT }}>
              <Landing onSubmit={start} initial={input ?? undefined} />
            </motion.div>
          )}

          {phase === "running" && input && (
            <motion.div key="running" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE_OUT }}>
              <PipelineLoader
                brand={input.brand}
                steps={steps}
                progress={progress}
                questions={questions}
                questionCount={run.questionCount}
                models={run.models}
                onCancel={cancel}
              />
            </motion.div>
          )}

          {phase === "error" && input && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StateMessage
                role="alert"
                icon={<AlertIcon />}
                title="That check didn't finish"
                actions={
                  <>
                    <Button onClick={() => start(input)}>Try again</Button>
                    <Button variant="secondary" onClick={() => setPhase("form")}>
                      Edit details
                    </Button>
                  </>
                }
              >
                <p>
                  Something went wrong while we were checking {input.brand}. Nothing was saved, so you can run it again
                  straight away.
                </p>
                {errorMessage && <p className="mt-1 text-sm text-ink-3">Details: {errorMessage}</p>}
              </StateMessage>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </PageTransition>
  );
}

function Landing({ onSubmit, initial }: { onSubmit: (input: ReportInput) => void; initial?: ReportInput }) {
  const models = useModels();
  const facts = ["10 shopper questions", capitalise(modelCountWords(models.length)), "About a minute", "Fixes in plain English"];
  return (
    <div className="grid gap-8 pb-4">
      {/*
        Intro, demo, form in that order on phones. On desktop the demo sits in the
        right column beside the headline and stays in view while you fill in the form.
      */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger}
        className="grid gap-5 pt-5 sm:pt-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-6 lg:gap-y-5"
      >
        <div className="lg:col-start-1 lg:row-start-1">
          <motion.h1 variants={rise} className="font-display text-[clamp(2.5rem,1.6rem+3vw,3.75rem)] leading-[1.02] text-ink">
            Is AI recommending <br className="hidden sm:block" />
            <Mark className="mark-under" delay={500}>
              your brand
            </Mark>
            ?
          </motion.h1>
          <motion.p variants={rise} className="mt-2 max-w-[54ch] text-lg text-ink-2">
            When shoppers ask {listModels(models, "or")} what to buy, does your name come up? We ask ten real shopper
            questions and show you the answers.
          </motion.p>
          <motion.ul variants={rise} className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink">
            {facts.map((fact) => (
              <li key={fact} className="inline-flex items-center gap-1">
                <span aria-hidden="true" className="size-1 bg-ink" />
                {fact}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div variants={rise} className="lg:sticky lg:top-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <LiveAnswer />
        </motion.div>

        <motion.div variants={rise} id="check" className="scroll-mt-10 lg:col-start-1 lg:row-start-2">
          <BrandForm onSubmit={onSubmit} initial={initial} />
        </motion.div>
      </motion.div>

      <QuestionTicker />
      <WhyItMatters />
      <HowItWorks />
      <ReportContents />
      <SampleReportCard />
      <Faq />
      <FinalCta />
    </div>
  );
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
