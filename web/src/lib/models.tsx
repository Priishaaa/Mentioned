import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MODEL_NAMES, getModels } from "./api";

/**
 * Which AI assistants the server actually measures, so every bit of copy
 * ("3 AI models", "We ask ChatGPT, Gemini and Claude") stays true.
 */
const ModelsContext = createContext<string[]>(MODEL_NAMES);

export function ModelsProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<string[]>(MODEL_NAMES);
  useEffect(() => {
    const controller = new AbortController();
    getModels(controller.signal).then(setModels);
    return () => controller.abort();
  }, []);
  return <ModelsContext.Provider value={models}>{children}</ModelsContext.Provider>;
}

export const useModels = () => useContext(ModelsContext);

/** "Gemini" / "ChatGPT and Gemini" / "ChatGPT, Gemini and Claude" (or "or" instead of "and"). */
export function listModels(models: string[], joiner: "and" | "or" = "and"): string {
  if (models.length <= 1) return models[0] ?? "AI assistants";
  return `${models.slice(0, -1).join(", ")} ${joiner} ${models[models.length - 1]}`;
}

const WORDS = ["no", "one", "two", "three", "four", "five", "six"];
/** "one AI model" / "three AI models". */
export const modelCountWords = (n: number) => `${WORDS[n] ?? n} AI model${n === 1 ? "" : "s"}`;
