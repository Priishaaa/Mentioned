import assert from "node:assert/strict";
import { test } from "node:test";
import { withRetry } from "./retry";

const rateLimited = Object.assign(new Error("429 Too Many Requests. Please retry in 0.01s."), { status: 429 });

test("retries rate limits, using the suggested delay, then succeeds", async () => {
  let calls = 0;
  const out = await withRetry(async () => {
    if (++calls < 3) throw rateLimited;
    return "ok";
  }, "test");
  assert.equal(out, "ok");
  assert.equal(calls, 3);
});

test("does not retry a bad request", async () => {
  let calls = 0;
  const bad = Object.assign(new Error("400 Bad Request"), { status: 400 });
  await assert.rejects(withRetry(async () => { calls++; throw bad; }, "test"));
  assert.equal(calls, 1);
});

test("gives up after the last attempt", async () => {
  let calls = 0;
  await assert.rejects(withRetry(async () => { calls++; throw rateLimited; }, "test", 3));
  assert.equal(calls, 3);
});

test("friendlyError explains common failures", async () => {
  const { friendlyError } = await import("./pipeline/run");
  const badKey = Object.assign(new Error('{"error":{"code":400,"message":"API key not valid. Please pass a valid API key."}}'), { status: 400 });
  assert.match(friendlyError(badKey), /API key was rejected/);
  assert.match(friendlyError(Object.assign(new Error("Too many"), { status: 429 })), /free-tier limit/);
  assert.equal(friendlyError(new Error('{"error":{"message":"Model not found"}}')), "Model not found");
});

test("reads hour-long waits and doesn't retry daily quotas", async () => {
  const { suggestedDelayMs } = await import("./retry");
  const daily = Object.assign(new Error("Quota exceeded ... Please retry in 17h41m33.30s."), { status: 429 });
  assert.equal(Math.round(suggestedDelayMs(daily)! / 3_600_000), 18);
  let calls = 0;
  await assert.rejects(withRetry(async () => { calls++; throw daily; }, "test"));
  assert.equal(calls, 1);
  const { friendlyError } = await import("./pipeline/run");
  assert.match(friendlyError(daily), /resets in about 18 hours/);
});
