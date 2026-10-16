const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function statusOf(e: unknown): number | undefined {
  const s = (e as { status?: unknown } | null)?.status;
  return typeof s === "number" ? s : undefined;
}

/**
 * Free tiers say how long to wait, e.g. "retry in 23s", "retryDelay":"23s" or,
 * when a daily quota is used up, "retry in 17h41m33s".
 */
export function suggestedDelayMs(e: unknown): number | undefined {
  const text = e instanceof Error ? e.message : String(e);
  const m = text.match(/retry(?:Delay"?:\s*"|\s+in\s+|\s+after\s+)((?:\d+h)?(?:\d+m)?(?:\d+(?:\.\d+)?s)?)/i);
  if (!m || !m[1]) return undefined;
  const h = Number(m[1].match(/(\d+)h/)?.[1] ?? 0);
  const min = Number(m[1].match(/(\d+)m/)?.[1] ?? 0);
  const s = Number(m[1].match(/([\d.]+)s/)?.[1] ?? 0);
  const ms = Math.ceil(((h * 60 + min) * 60 + s) * 1000);
  return ms > 0 ? ms : undefined;
}

/** Waits longer than this aren't worth retrying: it's a daily quota, not a blip. */
const MAX_WAIT_MS = 90_000;

const isRetryable = (e: unknown) => {
  const status = statusOf(e);
  if (status !== undefined) return status === 429 || status >= 500;
  return /429|RESOURCE_EXHAUSTED|rate limit|overloaded|ECONNRESET|ETIMEDOUT/i.test(e instanceof Error ? e.message : String(e));
};

/**
 * Retries rate-limit and server errors with backoff. Free tiers allow only a few
 * requests per minute, so waiting and trying again is normal, not a failure.
 */
export async function withRetry<T>(fn: () => Promise<T>, label: string, attempts = 5): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= attempts || !isRetryable(e)) throw e;
      const suggested = suggestedDelayMs(e);
      // "Come back in 17 hours": fail now instead of spending more requests on retries.
      if (suggested !== undefined && suggested > MAX_WAIT_MS) throw e;
      const wait = Math.min(suggested ?? 4000 * 2 ** (attempt - 1), 60_000);
      console.warn(`${label}: rate-limited or unavailable, retrying in ${Math.round(wait / 1000)}s (attempt ${attempt + 1}/${attempts})`);
      await sleep(wait);
    }
  }
}
