import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
export const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
export const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

/**
 * Which model does the work around the measurement (writing questions, reading
 * answers, writing fixes): Claude when there's an Anthropic key, otherwise
 * Gemini, which has a free tier.
 */
export const analysisProvider: "claude" | "gemini" | null = hasAnthropic ? "claude" : geminiKey ? "gemini" : null;

export const config = {
  port: Number(process.env.PORT ?? 8787),
  /** Where finished reports are saved as JSON. */
  dataDir: process.env.DATA_DIR ?? path.resolve(here, "../data"),
  /** Built frontend, served in production. */
  webDist: path.resolve(here, "../../web/dist"),

  // On the free tier each Gemini model has its own daily allowance, so the analysis
  // runs on Flash-Lite and leaves Flash's allowance for the answers being measured.
  analysisModel: process.env.ANALYSIS_MODEL ?? (analysisProvider === "claude" ? "claude-opus-5-5" : "gemini-3.1-flash-lite"),

  // The assistants being measured.
  claudeModel: process.env.CLAUDE_MODEL ?? "claude-opus-5-5",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-5",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",

  /** Checks allowed per IP per hour. */
  rateLimitPerHour: Number(process.env.RATE_LIMIT_PER_HOUR ?? 5),
  /**
   * Checks allowed per day for the whole site. The free Gemini tier allows about
   * 20 requests per model per day and a check needs ~13, so the default is low.
   */
  dailyCheckLimit: Number(process.env.DAILY_CHECK_LIMIT ?? (analysisProvider === "claude" ? 100 : 2)),
  /** Sites allowed to call this API from a browser, comma-separated (e.g. your Vercel URL). */
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean),
  /** Upstash Redis (free tier) for saved reports, when files don't survive restarts (e.g. Render free). */
  redisUrl: process.env.UPSTASH_REDIS_REST_URL,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  /** Parallel API calls within one check. Kept low on free tiers, which limit requests per minute. */
  concurrency: Number(process.env.CONCURRENCY ?? (analysisProvider === "claude" ? 6 : 2)),
  /** Answers read per analysis call. Batching keeps a check within free-tier limits. */
  readBatch: Number(process.env.READ_BATCH ?? 10),
};

/** With no analysis model available the server runs a simulated check that ends on the sample report. */
export const demoMode = process.env.DEMO_MODE === "1" || analysisProvider === null;
