import { AnimatePresence, MotionConfig } from "framer-motion";
import { Suspense, lazy, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ButtonLink } from "./components/Button";
import { SearchOffIcon } from "./components/Icons";
import { Container, Layout, PageTransition } from "./components/Layout";
import { ModelsProvider } from "./lib/models";
import { ReportSkeleton } from "./components/ReportSkeleton";
import { StateMessage } from "./components/StateMessage";
import { Home } from "./pages/Home";

// The report page pulls in Recharts; load it only when a report is opened.
const ReportPage = lazy(() => import("./pages/ReportPage").then((m) => ({ default: m.ReportPage })));

function NotFoundPage() {
  return (
    <PageTransition>
      <Container>
        <StateMessage icon={<SearchOffIcon />} title="This page doesn't exist" actions={<ButtonLink to="/">Go to the start</ButtonLink>}>
          The link may be broken or mistyped.
        </StateMessage>
      </Container>
    </PageTransition>
  );
}

export function App() {
  const location = useLocation();

  // Scroll to the #section in the URL (it may mount after the page transition), else to the top.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    let frame = 0;
    const started = performance.now();
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ block: "start" });
        if (id === "check") document.getElementById("brand")?.focus({ preventScroll: true });
      } else if (performance.now() - started < 1500) {
        frame = requestAnimationFrame(tryScroll);
      }
    };
    frame = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash, location.key]);

  return (
    // reducedMotion="user": transform/layout animations are skipped when the OS asks for reduced motion.
    <MotionConfig reducedMotion="user">
      <ModelsProvider>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route
              path="/report/:id"
              element={
                <Suspense
                  fallback={
                    <Container>
                      <ReportSkeleton />
                    </Container>
                  }
                >
                  <ReportPage />
                </Suspense>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </Layout>
      </ModelsProvider>
    </MotionConfig>
  );
}
