import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aggregate,
  cleanInput,
  overallSentiment,
  pickCompetitors,
  sameBrand,
  visibilityScore,
  type Query,
  type QueryResult,
} from "@mentioned/shared";
import { sampleReports } from "@mentioned/shared/fixtures";
import { fallbackExcerpt } from "./pipeline/read";
import { checkQuestions } from "./pipeline/questions";
import { mapLimit } from "./pipeline/run";

const res = (model: string, position: number | null, competitors: string[] = []): QueryResult => ({
  model,
  mentioned: position !== null,
  position,
  competitors,
  excerpt: "",
});

test("score: never named scores 0", () => {
  const q: Query[] = [{ id: 1, type: "discovery", intent: "x", text: "", results: [res("A", null), res("B", null)] }];
  assert.equal(visibilityScore(q), 0);
});

test("score: named first everywhere and always known scores 100", () => {
  const q: Query[] = [
    { id: 1, type: "discovery", intent: "x", text: "", results: [res("A", 1), res("B", 1)] },
    { id: 2, type: "brand_check", intent: "y", text: "", results: [res("A", 1)] },
  ];
  assert.equal(visibilityScore(q), 100);
});

test("score: later positions count for less", () => {
  const first: Query[] = [{ id: 1, type: "discovery", intent: "x", text: "", results: [res("A", 1)] }];
  const third: Query[] = [{ id: 1, type: "discovery", intent: "x", text: "", results: [res("A", 3)] }];
  assert.ok(visibilityScore(first) > visibilityScore(third));
});

test("sameBrand matches spelling variants but not different brands", () => {
  assert.ok(sameBrand("Crease & Co", "crease and co"));
  assert.ok(sameBrand("SG", "sg"));
  assert.ok(!sameBrand("SG", "SS"));
  assert.ok(!sameBrand("", ""));
});

test("pickCompetitors keeps the founder's list and tops up with the most-named brands", () => {
  const discovery = [res("A", null, ["Zed", "Yak"]), res("B", null, ["Zed"]), res("C", 1, ["Crease and Co", "Xen"])];
  assert.deepEqual(pickCompetitors("Crease & Co", ["Mine"], discovery, 3), ["Mine", "Zed", "Yak"]);
});

test("aggregate counts share of voice across spellings", () => {
  const q: Query[] = [{ id: 1, type: "discovery", intent: "budget", text: "", results: [res("A", 2, ["S.G."]), res("B", null, ["sg"])] }];
  const a = aggregate("Brand", ["SG"], q);
  assert.equal(a.shareOfVoice.find((s) => s.name === "SG")?.mentions, 2);
  assert.equal(a.mentionRate, 0.5);
  assert.deepEqual(a.intents, [{ label: "budget", status: "visible" }]);
});

test("sample reports still aggregate to the published numbers", () => {
  const crease = sampleReports["crease-and-co"];
  assert.equal(Math.round(crease.stats.mentionRate * 100), 33);
  assert.equal(crease.stats.avgPosition, 2.5);
  assert.deepEqual(crease.shareOfVoice.map((s) => s.mentions), [13, 11, 6, 5, 3]);
  assert.equal(sampleReports["lattu-toys"].stats.mentionRate, 0);
});

test("overallSentiment", () => {
  assert.equal(overallSentiment([]), "neutral");
  assert.equal(overallSentiment(["positive", "positive", "neutral"]), "positive");
  assert.equal(overallSentiment(["negative", "negative", "positive"]), "negative");
});

test("cleanInput validates and tidies", () => {
  assert.equal(cleanInput({ brand: " ", category: "x" }).ok, false);
  assert.equal(cleanInput({ brand: "Brand", category: "x", competitors: ["w", "x", "y", "z"] }).ok, false);
  const ok = cleanInput({ brand: " Brand ", category: "toys", competitors: ["Brand", "Other", "Other"] });
  assert.ok(ok.ok);
  if (ok.ok) {
    assert.equal(ok.input.brand, "Brand");
    assert.equal(ok.input.country, "India");
    assert.deepEqual(ok.input.competitors, ["Other"]);
  }
});

test("checkQuestions catches a wrong mix and brand names in discovery", () => {
  const input = { brand: "Lattu", website: "", category: "toys", country: "India", competitors: ["Shumee"] };
  const qs = [
    ...Array.from({ length: 5 }, (_, i) => ({ id: i + 1, type: "discovery" as const, intent: "x", text: "best toys" })),
    { id: 6, type: "discovery" as const, intent: "x", text: "is shumee good" },
    { id: 7, type: "brand_check" as const, intent: "y", text: "lattu?" },
    { id: 8, type: "comparison" as const, intent: "z", text: "lattu vs shumee" },
  ];
  const problems = checkQuestions(input, qs);
  assert.ok(problems.some((p) => p.includes("brand_check")));
  assert.ok(problems.some((p) => p.includes("names a brand")));
});

test("fallbackExcerpt picks the sentence naming the brand", () => {
  const answer = "Try **SG** first. For value, Crease & Co is good. It ships fast. Also MRF.";
  assert.equal(fallbackExcerpt(answer, "Crease & Co"), "For value, Crease & Co is good. It ships fast.");
});

test("mapLimit keeps order and respects the limit", async () => {
  let inFlight = 0;
  let peak = 0;
  const out = await mapLimit([1, 2, 3, 4, 5], 2, async (n) => {
    peak = Math.max(peak, ++inFlight);
    await new Promise((r) => setTimeout(r, 5));
    inFlight--;
    return n * 10;
  });
  assert.deepEqual(out, [10, 20, 30, 40, 50]);
  assert.equal(peak, 2);
});
