import assert from "node:assert/strict";
import { test } from "node:test";
import type { PipelineEvent } from "@mentioned/shared";

// Force demo mode and make it fast, before the app reads its config.
process.env.DEMO_MODE = "1";
process.env.DEMO_DELAY_SCALE = "0.001";
const { app } = await import("./app");

test("health reports demo mode", async () => {
  const res = await app.request("/api/health");
  assert.equal(res.status, 200);
  assert.equal(((await res.json()) as { demoMode: boolean }).demoMode, true);
});

test("rejects invalid input", async () => {
  const res = await app.request("/api/reports", { method: "POST", body: JSON.stringify({ brand: "" }), headers: { "content-type": "application/json" } });
  assert.equal(res.status, 400);
});

test("a check streams progress and ends on a report", async () => {
  const create = await app.request("/api/reports", {
    method: "POST",
    body: JSON.stringify({ brand: "Willow Works", category: "cricket gear", competitors: ["SG"] }),
    headers: { "content-type": "application/json" },
  });
  assert.equal(create.status, 202);
  const { id, models } = (await create.json()) as { id: string; models: string[] };
  assert.equal(models.length, 3);

  const stream = await app.request(`/api/reports/${id}/events`);
  const text = await stream.text(); // ends when the check finishes
  const events: PipelineEvent[] = text
    .split("\n")
    .filter((l) => l.startsWith("data: ") && l.length > 6)
    .map((l) => JSON.parse(l.slice(6)));
  assert.equal(events.filter((e) => e.type === "question").length, 10);
  const last = events.at(-1);
  assert.equal(last?.type, "done");
  if (last?.type === "done") {
    assert.equal(last.isSample, true);
    const report = await app.request(`/api/reports/${last.id}`);
    assert.equal(report.status, 200);
    assert.equal(((await report.json()) as { brand: string }).brand, "Crease & Co");
  }
});

test("unknown reports are 404, and ids can't escape the data folder", async () => {
  assert.equal((await app.request("/api/reports/nope-nope-nope")).status, 404);
  assert.equal((await app.request("/api/reports/..%2F..%2Fpackage")).status, 404);
  assert.equal((await app.request("/api/reports/nope-nope-nope/events")).status, 404);
});

test("browsers on allowed sites may call the API; others may not", async () => {
  const allowed = await app.request("/api/health", { headers: { Origin: "http://localhost:5173" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");
  const other = await app.request("/api/health", { headers: { Origin: "https://evil.example" } });
  assert.equal(other.headers.get("access-control-allow-origin"), null);
});
