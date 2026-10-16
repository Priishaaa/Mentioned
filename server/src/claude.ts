import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type * as z from "zod/v4";
import { config } from "./config";

let client: Anthropic | null = null;
export function anthropic(): Anthropic {
  client ??= new Anthropic({ timeout: 120_000, maxRetries: 2 });
  return client;
}

/**
 * One Claude call that must return JSON matching `schema` (see analysis.ts).
 * This is the work around the measurement, so it opts into server-side refusal
 * fallbacks: a decline is retried on another model.
 */
export async function claudeStructured<S extends z.ZodType>(
  schema: S,
  prompt: string,
  { effort = "medium" }: { effort?: "low" | "medium" | "high" } = {},
): Promise<z.infer<S>> {
  const response = await anthropic().beta.messages.parse({
    model: config.analysisModel,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort, format: betaZodOutputFormat(schema) },
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") {
    throw new Error(`Claude declined: ${response.stop_details?.explanation ?? "no reason given"}`);
  }
  if (response.parsed_output == null) {
    throw new Error(`Claude returned no usable JSON (stop reason: ${response.stop_reason}).`);
  }
  return response.parsed_output as z.infer<S>;
}
