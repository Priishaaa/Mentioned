/*
 * The only place the UI talks to the backend (server/). In development Vite
 * proxies /api to the server; in production the server serves this app itself.
 */
import type { PipelineEvent, Report, ReportInput } from "@mentioned/shared";

/**
 * Where the API lives. Empty in development (Vite proxies /api) and when the
 * server serves this app itself; set VITE_API_URL when the frontend is hosted
 * separately, e.g. on Vercel with the API on Render.
 */
const API = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ReportNotFoundError extends Error {
  constructor(id: string) {
    super(`No report with id "${id}"`);
    this.name = "ReportNotFoundError";
  }
}

/** An error whose message is safe and useful to show the person. */
export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

/** Used before the server says otherwise (e.g. for copy on the landing page). */
export const MODEL_NAMES = ["ChatGPT", "Gemini", "Claude"];
export const QUESTION_COUNT = 10;

/** Report id that always fails, so the error state can be seen. */
export const ERROR_DEMO_ID = "error-demo";

async function errorFrom(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (body?.error) return new ApiError(body.error, res.status);
  if (res.status >= 500) return new ApiError("The server ran into a problem. Try again in a moment.", res.status);
  return new ApiError(`Request failed (${res.status}).`, res.status);
}

/** Which assistants the server measures, so copy like "3 AI models" stays true. */
export async function getModels(signal?: AbortSignal): Promise<string[]> {
  try {
    const res = await fetch(`${API}/api/health`, { signal });
    if (!res.ok) return MODEL_NAMES;
    const body = (await res.json()) as { models?: string[] };
    return body.models?.length ? body.models : MODEL_NAMES;
  } catch {
    return MODEL_NAMES;
  }
}

export async function getReport(id: string, signal?: AbortSignal): Promise<Report> {
  if (id === ERROR_DEMO_ID) throw new ApiError("This is the error demo. The report service didn't respond.");
  let res: Response;
  try {
    res = await fetch(`${API}/api/reports/${encodeURIComponent(id)}`, { signal });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ApiError("Couldn't reach the server. Check your connection.");
  }
  if (res.status === 404) throw new ReportNotFoundError(id);
  if (res.status === 202) throw new ApiError("This check is still running. Try again in a few seconds.", 202);
  if (!res.ok) throw await errorFrom(res);
  return (await res.json()) as Report;
}

export type CreateReportResult = {
  id: string;
  /** True in demo mode: the report is sample data, not this brand's. */
  isSample: boolean;
};

export type CheckStarted = { models: string[]; questionCount: number };

/**
 * Starts a visibility check and streams its progress through onEvent until it
 * finishes. Takes 30–60 seconds with real API keys.
 */
export async function createReport(
  input: ReportInput,
  {
    onEvent,
    onStart,
    signal,
  }: { onEvent: (e: PipelineEvent) => void; onStart?: (info: CheckStarted) => void; signal?: AbortSignal },
): Promise<CreateReportResult> {
  let res: Response;
  try {
    res = await fetch(`${API}/api/reports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw await errorFrom(res);
  const { id, models, questionCount } = (await res.json()) as { id: string } & CheckStarted;
  onStart?.({ models, questionCount });

  return new Promise<CreateReportResult>((resolve, reject) => {
    const source = new EventSource(`${API}/api/reports/${encodeURIComponent(id)}/events`);
    const close = () => source.close();
    signal?.addEventListener(
      "abort",
      () => {
        close();
        reject(signal.reason);
      },
      { once: true },
    );
    source.onmessage = (msg) => {
      const event = JSON.parse(msg.data) as PipelineEvent;
      if (event.type === "done") {
        close();
        resolve({ id: event.id, isSample: event.isSample });
      } else if (event.type === "error") {
        close();
        reject(new ApiError(event.message));
      } else {
        onEvent(event);
      }
    };
    // EventSource reconnects by itself after a dropped connection, and the server
    // replays the log. Only give up once it has stopped trying.
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        reject(new ApiError("Lost touch with the server while the check was running."));
      }
    };
  });
}
