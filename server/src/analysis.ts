import { GoogleGenAI } from "@google/genai";
import * as z from "zod/v4";
import { claudeStructured } from "./claude";
import { analysisProvider, config, geminiKey } from "./config";
import { withRetry } from "./retry";

let gemini: GoogleGenAI | null = null;

async function geminiStructured<S extends z.ZodType>(schema: S, prompt: string): Promise<z.infer<S>> {
  gemini ??= new GoogleGenAI({ apiKey: geminiKey! });
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>;
  const response = await withRetry(
    () =>
      gemini!.models.generateContent({
        model: config.analysisModel,
        contents: prompt,
        config: { responseMimeType: "application/json", responseJsonSchema: jsonSchema },
      }),
    "Gemini (analysis)",
  );
  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response.");
  const parsed = schema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error(`Gemini's JSON didn't match the expected shape: ${parsed.error.message}`);
  return parsed.data;
}

/**
 * One analysis call that must return JSON matching `schema`: writing questions,
 * reading answers, writing fixes. Uses Claude when there's an Anthropic key,
 * otherwise Gemini (free tier).
 */
export async function structured<S extends z.ZodType>(
  schema: S,
  prompt: string,
  options: { effort?: "low" | "medium" | "high" } = {},
): Promise<z.infer<S>> {
  if (analysisProvider === "claude") return claudeStructured(schema, prompt, options);
  if (analysisProvider === "gemini") return geminiStructured(schema, prompt);
  throw new Error("No analysis model configured: set ANTHROPIC_API_KEY or GEMINI_API_KEY.");
}
