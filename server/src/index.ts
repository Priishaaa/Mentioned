import "./env"; // must stay first: loads .env before config is read
import { serve } from "@hono/node-server";
import { app } from "./app";
import { analysisProvider, config, demoMode } from "./config";
import { enabledProviders } from "./providers";

serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`Mentioned API on http://localhost:${port}`);
  if (demoMode) {
    console.log("Demo mode: no GEMINI_API_KEY or ANTHROPIC_API_KEY, so checks are simulated and end on the sample report.");
    return;
  }
  const providers = enabledProviders();
  console.log(`Analysis (questions, reading, fixes): ${analysisProvider === "claude" ? "Claude" : "Gemini"} (${config.analysisModel})`);
  console.log(`Measuring: ${providers.map((p) => `${p.name} (${p.model}${p.note ? `, ${p.note}` : ""})`).join(", ")}`);
  if (!providers.some((p) => p.name === "ChatGPT")) console.log("ChatGPT isn't measured: it needs a paid OPENAI_API_KEY.");
  if (!providers.some((p) => p.name === "Claude")) console.log("Claude isn't measured: it needs a paid ANTHROPIC_API_KEY.");
});
