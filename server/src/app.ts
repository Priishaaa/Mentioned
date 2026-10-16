import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { getConnInfo } from "@hono/node-server/conninfo";
import { serveStatic } from "@hono/node-server/serve-static";
import { cleanInput, type PipelineEvent } from "@mentioned/shared";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { analysisProvider, config, demoMode } from "./config";
import { runDemo } from "./pipeline/demo";
import { runCheck } from "./pipeline/run";
import { enabledProviders } from "./providers";
import { createJob, getJob, loadReport, newId } from "./store";

export const QUESTION_COUNT = 10;
const DEMO_MODELS = ["ChatGPT", "Gemini", "Claude"];

/* ── Rate limit: N checks per IP per hour (each check costs real money) ──── */

const hits = new Map<string, number[]>();
function clientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
}
function allow(ip: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= config.rateLimitPerHour) {
    hits.set(ip, recent);
    return { ok: false, retryAfter: Math.ceil((recent[0] + 3_600_000 - now) / 1000) };
  }
  recent.push(now);
  hits.set(ip, recent);
  return { ok: true, retryAfter: 0 };
}

/* ── Daily cap for the whole site (free API tiers have small daily allowances) ── */

let day = "";
let checksToday = 0;
function takeDailySlot(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    checksToday = 0;
  }
  if (checksToday >= config.dailyCheckLimit) return false;
  checksToday++;
  return true;
}

/* ── API ──────────────────────────────────────────────────────────────────── */

export const app = new Hono();

// Let the frontend call the API from its own domain (e.g. Vercel → Render).
app.use("/api/*", cors({ origin: config.allowedOrigins, allowMethods: ["GET", "POST"], maxAge: 600 }));

app.get("/api/health", (c) =>
  c.json({ ok: true, demoMode, analysis: demoMode ? null : analysisProvider, models: demoMode ? DEMO_MODELS : enabledProviders().map((p) => p.name) }),
);

app.post("/api/reports", async (c) => {
  const parsed = cleanInput(await c.req.json().catch(() => null));
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);

  if (!demoMode) {
    const limit = allow(clientIp(c));
    if (!limit.ok) {
      c.header("Retry-After", String(limit.retryAfter));
      return c.json({ error: "You've run a lot of checks in the last hour. Try again a little later." }, 429);
    }
    if (!takeDailySlot()) {
      return c.json({ error: "Today's free checks are all used up. Please try again tomorrow." }, 429);
    }
  }

  const id = newId();
  const job = createJob(id);
  if (demoMode) {
    void runDemo(job, parsed.input, DEMO_MODELS.length);
    return c.json({ id, models: DEMO_MODELS, questionCount: QUESTION_COUNT }, 202);
  }
  const providers = enabledProviders();
  void runCheck(job, parsed.input, providers);
  return c.json({ id, models: providers.map((p) => p.name), questionCount: QUESTION_COUNT }, 202);
});

/** Live progress for a running check. Replays everything so far, then streams the rest. */
app.get("/api/reports/:id/events", async (c) => {
  const id = c.req.param("id");
  const job = getJob(id);
  if (!job) {
    const report = await loadReport(id);
    if (!report) return c.json({ error: "No such check." }, 404);
    return streamSSE(c, async (stream) => {
      await stream.writeSSE({ data: JSON.stringify({ type: "done", id, isSample: false } satisfies PipelineEvent) });
    });
  }

  return streamSSE(c, async (stream) => {
    let closed = false;
    let wake: () => void = () => {};
    const queue: PipelineEvent[] = [...job.events];
    const listener = (e: PipelineEvent) => {
      queue.push(e);
      wake();
    };
    job.listeners.add(listener);
    stream.onAbort(() => {
      closed = true;
      wake();
    });
    // Keep the connection alive through slow steps (proxies drop idle streams).
    const heartbeat = setInterval(() => {
      if (!closed) stream.writeSSE({ event: "ping", data: "" }).catch(() => {});
    }, 15_000);
    try {
      while (!closed) {
        while (queue.length) {
          const e = queue.shift()!;
          await stream.writeSSE({ data: JSON.stringify(e) });
          if (e.type === "done" || e.type === "error") return;
        }
        // Nothing queued: sleep until the next event or until the client leaves.
        await new Promise<void>((resolve) => (wake = resolve));
      }
    } finally {
      clearInterval(heartbeat);
      job.listeners.delete(listener);
    }
  });
});

app.get("/api/reports/:id", async (c) => {
  const id = c.req.param("id");
  const report = await loadReport(id);
  if (report) return c.json(report);
  const job = getJob(id);
  if (job && !job.finished) return c.json({ status: "running" }, 202);
  return c.json({ error: "Report not found." }, 404);
});

app.all("/api/*", (c) => c.json({ error: "Not found." }, 404));

/* ── Frontend (production): built files, with index.html for client routes ── */

if (existsSync(config.webDist)) {
  const indexHtml = readFileSync(path.join(config.webDist, "index.html"), "utf8");
  app.use("/*", serveStatic({ root: path.relative(process.cwd(), config.webDist) }));
  app.get("*", (c) => c.html(indexHtml));
}
