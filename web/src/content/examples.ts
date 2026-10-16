import { DEMO_REPORT_ID, sampleReports } from "@mentioned/shared/fixtures";

/*
 * Illustrative examples for the landing page, spread across categories so the
 * product doesn't read as cricket-only. Every brand here is made up, including
 * the competitors, so no real company is quoted. The cricket example comes from
 * the sample report.
 */

export type ExampleAnswer = { model: string; position: number | null; excerpt: string };

export type Example = {
  category: string;
  brand: string;
  competitors: string[];
  question: string;
  answers: ExampleAnswer[];
};

const crease = sampleReports[DEMO_REPORT_ID];
const creaseBudget = crease.queries.find((q) => q.intent === "budget") ?? crease.queries[0];

export const EXAMPLES: Example[] = [
  {
    category: "Skincare",
    brand: "Lumen & Leaf",
    competitors: ["Softhaus", "Cedarbloom"],
    question: "good vitamin c serum for oily skin under 1000? its very humid here",
    answers: [
      {
        model: "ChatGPT",
        position: 2,
        excerpt:
          "For oily skin in humid weather, look for a light, water-based serum with 10–15% vitamin C. Softhaus is the common pick, and Lumen & Leaf's gel serum is a lighter option that people with acne-prone skin like.",
      },
      {
        model: "Gemini",
        position: null,
        excerpt:
          "Softhaus and Cedarbloom both make lightweight vitamin C serums under ₹1,000. Patch test first, since higher strengths can sting.",
      },
      {
        model: "Claude",
        position: 1,
        excerpt:
          "Lumen & Leaf's 10% vitamin C gel is a good fit: it's light and doesn't feel sticky in humidity. Cedarbloom is a slightly cheaper alternative.",
      },
    ],
  },
  {
    category: "Coffee",
    brand: "Monsoon Hill",
    competitors: ["Bluefern", "Ridgeback Roasters"],
    question: "which indian coffee is good for a beginner with a french press",
    answers: [
      {
        model: "ChatGPT",
        position: null,
        excerpt:
          "Bluefern and Ridgeback Roasters both sell medium roasts ground for a French press, which are easy for beginners. Start with a chocolatey, low-acid blend.",
      },
      {
        model: "Gemini",
        position: 2,
        excerpt:
          "Ridgeback Roasters is a popular starting point. Monsoon Hill's estate blend is also beginner-friendly and comes in a coarse grind.",
      },
      {
        model: "Claude",
        position: 3,
        excerpt:
          "Try a medium roast from Bluefern or Ridgeback Roasters. Monsoon Hill is worth a look if you want single-estate beans at a similar price.",
      },
    ],
  },
  {
    category: "Running shoes",
    brand: "Stride Lab",
    competitors: ["Kicklane", "Northpaw"],
    question: "running shoes for flat feet under 5000, mostly road running",
    answers: [
      {
        model: "ChatGPT",
        position: null,
        excerpt:
          "Look for a stability shoe with firm arch support. Kicklane's Glide and Northpaw's Steady are both under ₹5,000 and suit road running.",
      },
      {
        model: "Gemini",
        position: null,
        excerpt: "Northpaw makes some of the best budget stability shoes. Get your gait checked at a store if you can.",
      },
      {
        model: "Claude",
        position: 2,
        excerpt:
          "Kicklane's Glide is the safe choice. Stride Lab, a newer Indian brand, has a stability model with a wider toe box that runners with flat feet rate well.",
      },
    ],
  },
  {
    category: "Home decor",
    brand: "Kora Living",
    competitors: ["Hearthline", "Oakweave"],
    question: "where to buy handmade cotton rugs online that dont shed",
    answers: [
      {
        model: "ChatGPT",
        position: 1,
        excerpt:
          "Kora Living sells flat-woven cotton dhurries that shed very little and are machine-washable. Hearthline is another good option with more colours.",
      },
      {
        model: "Gemini",
        position: 2,
        excerpt: "Hearthline and Kora Living both sell handwoven cotton rugs online. Flat weaves shed less than tufted ones.",
      },
      {
        model: "Claude",
        position: null,
        excerpt: "Look for flat-woven dhurries rather than tufted rugs. Oakweave and Hearthline both have well-reviewed ranges.",
      },
    ],
  },
  {
    category: crease.category,
    brand: crease.brand,
    competitors: crease.shareOfVoice.filter((s) => !s.isBrand).map((s) => s.name),
    question: creaseBudget.text,
    answers: creaseBudget.results.map((r) => ({ model: r.model, position: r.mentioned ? r.position : null, excerpt: r.excerpt })),
  },
];
