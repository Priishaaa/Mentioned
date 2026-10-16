import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "./Button";
import { CheckIcon, DownloadIcon, LinkIcon, RefreshIcon } from "./Icons";
import { Reveal } from "./Section";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers/contexts without the async clipboard API.
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
}

export function ReportActions() {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const t = setTimeout(() => setStatus("idle"), 2400);
    return () => clearTimeout(t);
  }, [status]);

  const copy = async () => setStatus((await copyText(window.location.href)) ? "copied" : "failed");

  return (
    <Reveal className="no-print flex flex-col gap-2 border-t-2 border-rule pt-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-display-sm text-ink">Share or save this report</p>
        <p aria-live="polite" className="mt-0.5 h-3 text-sm text-ink-2">
          <AnimatePresence mode="wait">
            {status !== "idle" && (
              <motion.span key={status} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-0.5">
                {status === "copied" ? (
                  <>
                    <CheckIcon /> Link copied
                  </>
                ) : (
                  "Couldn't copy. Copy the address from your browser bar instead."
                )}
              </motion.span>
            )}
          </AnimatePresence>
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        <Button variant="secondary" onClick={copy}>
          <LinkIcon /> Copy share link
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          <DownloadIcon /> Download as PDF
        </Button>
        <ButtonLink to="/" variant="primary">
          <RefreshIcon /> Check another brand
        </ButtonLink>
      </div>
    </Reveal>
  );
}
