import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { anthropic } from "./claude";
import { config, geminiKey, hasAnthropic, hasOpenAI } from "./config";
import { withRetry } from "./retry";

/** An AI assistant we measure. Each one is enabled only when its key is set. */
export type Provider = {
  name: string;
  model: string;
  /** Shown at startup, e.g. "free tier". */
  note?: string;
  ask: (question: string) => Promise<{ text: string; refused: boolean }>;
};

const TIMEOUT_MS = 90_000;

function claudeProvider(): Provider {
  return {
    name: "Claude",
    model: config.claudeModel,
    async ask(question) {
      // No refusal fallback here: it would silently swap in another model and
      // blur what we're measuring. A refusal is recorded instead.
      const response = await anthropic().messages.create(
        { model: config.claudeModel, max_tokens: 16000, messages: [{ role: "user", content: question }] },
        { timeout: TIMEOUT_MS },
      );
      const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
      return { text, refused: response.stop_reason === "refusal" };
    },
  };
}

function openaiProvider(): Provider {
  const client = new OpenAI({ timeout: TIMEOUT_MS, maxRetries: 2 });
  return {
    name: "ChatGPT",
    model: config.openaiModel,
    async ask(question) {
      const response = await client.responses.create({ model: config.openaiModel, input: question });
      return { text: response.output_text, refused: false };
    },
  };
}

function geminiProvider(apiKey: string): Provider {
  const client = new GoogleGenAI({ apiKey });
  return {
    name: "Gemini",
    model: config.geminiModel,
    async ask(question) {
      const response = await withRetry(() => client.models.generateContent({ model: config.geminiModel, contents: question }), "Gemini");
      return { text: response.text ?? "", refused: false };
    },
  };
}

export function enabledProviders(): Provider[] {
  const providers: Provider[] = [];
  if (hasOpenAI) providers.push(openaiProvider());
  if (geminiKey) providers.push(geminiProvider(geminiKey));
  if (hasAnthropic) providers.push(claudeProvider());
  return providers;
}
