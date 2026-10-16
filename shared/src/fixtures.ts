import { aggregate } from "./aggregate";
import type { Query, Report } from "./types";

/*
 * Sample reports, shown on the landing page and as demos. Their aggregates are
 * computed from the query results with the same code the server uses, so the
 * numbers always agree with the answers. The score and verdict are hand-set.
 */

type BaseReport = Omit<Report, "models" | "shareOfVoice" | "intents" | "stats"> & {
  competitors: string[];
  sentiment: Report["stats"]["sentiment"];
};

function finalize({ competitors, sentiment, ...base }: BaseReport): Report {
  const { mentionRate, avgPosition, ...rest } = aggregate(base.brand, competitors, base.queries);
  return { ...base, ...rest, stats: { mentionRate, avgPosition, sentiment } };
}

const r = (
  model: string,
  position: number | null,
  competitors: string[],
  excerpt: string,
): Query["results"][number] => ({ model, mentioned: position !== null, position, competitors, excerpt });

/* ── Crease & Co: Indian D2C cricket gear, mid score ───────────────────────── */

const creaseAndCo = finalize({
  id: "crease-and-co",
  brand: "Crease & Co",
  category: "Cricket gear",
  country: "India",
  createdAt: "2026-10-12T09:30:00+05:30",
  score: 41,
  verdict: "AI knows you when asked, but rarely brings you up on its own.",
  competitors: ["SG", "SS", "MRF", "Kookaburra"],
  sentiment: "positive",
  queries: [
    {
      id: 1,
      type: "discovery",
      intent: "beginner",
      text: "best cricket bat for a beginner under 5000? son is 14 and just started leather ball",
      results: [
        r("ChatGPT", 3, ["SS", "SG"], "For a 14-year-old starting leather ball, stick to a lighter Kashmir willow or entry English willow bat. SS Ton Reserve and SG RSD Spark are safe picks, and Crease & Co's Junior Pro is a newer option that comes pre-knocked, which saves you a week of prep."),
        r("Gemini", null, ["SG", "SS", "MRF"], "Good beginner bats under ₹5,000 include the SG Sierra, SS Master 5000 and MRF Genius Grand. Look for a short handle size and a weight around 1.1 kg."),
        r("Claude", null, ["SS", "Kookaburra"], "At this budget I'd look at the SS Master range or a Kookaburra Kahuna junior. Prioritise pick-up over big edges; a heavy bat will slow his technique down."),
      ],
    },
    {
      id: 2,
      type: "discovery",
      intent: "budget",
      text: "decent english willow bat under 10k in india?? or is that not possible",
      results: [
        r("ChatGPT", 2, ["SG"], "It's possible if you accept grade 4–5 willow. SG's Savage Edition is the usual answer, and Crease & Co sells a grade 4 English willow bat at around ₹8,500 that gets good reviews for its pick-up."),
        r("Gemini", null, ["SS", "SG"], "Yes. The SS Sky Blaster and SG Profile are both English willow bats that usually sell under ₹10,000 online. Expect fewer grains and a plainer face than premium bats."),
        r("Claude", 2, ["SS", "MRF"], "You can, at grade 4 or 5. SS Ton Super is a common pick; Crease & Co's Club 4 is worth a look too, since it ships knocked-in. MRF's entry English willow bats are another option if you catch a sale."),
      ],
    },
    {
      id: 3,
      type: "discovery",
      intent: "durability",
      text: "which cricket bat brands actually last? my last bat cracked in one season",
      results: [
        r("ChatGPT", null, ["SG", "SS"], "Cracks in the first season are usually down to knocking-in, not just the brand. That said, SG and SS have the most consistent quality control at mid-range prices, and both replace bats with manufacturing faults."),
        r("Gemini", null, ["Kookaburra", "SG"], "Kookaburra and SG are known for durable willow and decent warranty support. Whatever you buy, oil it lightly and use an anti-scuff sheet."),
        r("Claude", null, ["SS", "Kookaburra", "MRF"], "Durability depends more on willow grade and preparation than the logo, but SS, Kookaburra and MRF all have a good track record. Ask for a bat that has been fully knocked in."),
      ],
    },
    {
      id: 4,
      type: "discovery",
      intent: "gifting",
      text: "gift for 12 yr old nephew who's mad about cricket, budget around 3000",
      results: [
        r("ChatGPT", null, ["SG"], "A junior kit bag from SG with gloves and pads fits that budget. If he mostly plays in the society, a good tennis-ball bat is a fun alternative."),
        r("Gemini", null, ["SS"], "Consider an SS junior gloves and helmet combo, or a size 5 Kashmir willow bat."),
        r("Claude", 3, ["SG", "SS"], "A size 5 Kashmir willow bat from SG or SS is a classic gift. For something more personal, Crease & Co will engrave a junior bat with his name for under ₹3,000."),
      ],
    },
    {
      id: 5,
      type: "discovery",
      intent: "made in India",
      text: "cricket gear brands made in india thats actually good quality, want to support desi brands",
      results: [
        r("ChatGPT", 2, ["SG", "SS"], "Most of India's cricket gear comes from Meerut and Jalandhar. SG is the best-known, and Crease & Co is a smaller direct-to-consumer brand from Meerut with a good reputation for its bats. SS is also worth a look for protective gear."),
        r("Gemini", 3, ["SG", "SS"], "Well-known Indian brands include SG and SS, both based in Meerut. Newer online brands like Crease & Co also manufacture in India and sell directly."),
        r("Claude", null, ["SG", "SS", "MRF"], "SG, SS and MRF are all Indian and widely trusted. Many smaller Meerut workshops make good bats too, but quality varies more."),
      ],
    },
    {
      id: 6,
      type: "discovery",
      intent: "willow type",
      text: "kashmir willow vs english willow, which one for tennis ball cricket on weekends",
      results: [
        r("ChatGPT", null, [], "For tennis ball cricket, Kashmir willow is the better buy: it's tougher, cheaper, and you won't feel the difference with a tennis ball. Save English willow for leather."),
        r("Gemini", null, ["SS"], "Kashmir willow. It handles tennis and taped balls well. The SS tennis-ball bat range is popular for exactly this."),
        r("Claude", null, ["MRF"], "Kashmir willow, or a dedicated tennis-ball bat like MRF's lighter range. English willow is wasted on a tennis ball and can be damaged by taped balls."),
      ],
    },
    {
      id: 7,
      type: "brand_check",
      intent: "reputation",
      text: "is crease & co any good for cricket bats? seen their ads on insta",
      results: [
        r("ChatGPT", 1, [], "Crease & Co is a Meerut-based D2C brand with mostly positive reviews for value. Buyers like that the bats come knocked-in. It has fewer reviews than older brands, so check the willow grade on the listing."),
        r("Gemini", 1, ["SG", "SS"], "Crease & Co has limited reviews online. Customers mention good balance for the price, but it's less established than SG or SS."),
        r("Claude", 1, [], "From what's available, Crease & Co is well regarded for value-for-money English willow bats, especially at grade 4–5. It's a younger brand, so its after-sales support has less of a track record."),
      ],
    },
    {
      id: 8,
      type: "brand_check",
      intent: "complaints",
      text: "crease and co bat complaints? handle coming loose?",
      results: [
        r("ChatGPT", 1, [], "A few buyers of Crease & Co bats have reported handles loosening after heavy use. The brand reportedly replaces handles under warranty, but confirm the terms before buying."),
        r("Gemini", 1, [], "Some reviews of Crease & Co mention the handle grip wearing quickly. Most complaints are about delivery times rather than the bats themselves."),
        r("Claude", 1, [], "I don't see a pattern of serious complaints about Crease & Co, though a few reviews mention loose handles. That can happen with any bat that isn't stored properly."),
      ],
    },
    {
      id: 9,
      type: "comparison",
      intent: "vs SG",
      text: "crease & co vs SG which bat is better for club cricket",
      results: [
        r("ChatGPT", 2, ["SG"], "SG has the longer track record and a wider range. Crease & Co is better value at the same willow grade and comes ready to play. For club cricket either works, so pick by feel."),
        r("Gemini", 2, ["SG"], "SG is the safer choice, with established quality and easy replacements. Crease & Co is cheaper for similar specs but less proven."),
        r("Claude", 1, ["SG"], "At around ₹8,000–10,000, Crease & Co usually gives you a better grade of willow than SG for the money. SG wins on service network and resale value."),
      ],
    },
    {
      id: 10,
      type: "comparison",
      intent: "vs SS",
      text: "crease and co or SS ton for leather ball, budget 12k",
      results: [
        r("ChatGPT", 2, ["SS"], "SS Ton is the more popular choice in this range and has strong reviews. Crease & Co offers a higher willow grade at ₹12,000, but fewer people have used it long term."),
        r("Gemini", 2, ["SS"], "The SS Ton range is widely used and reliable. Crease & Co is a newer alternative with good value."),
        r("Claude", 1, ["SS"], "Crease & Co's grade 3 bat is a strong option at ₹12,000. SS Ton is more proven and easier to find in shops if you want to pick one up first."),
      ],
    },
  ],
  descriptors: [
    "a smaller direct-to-consumer brand from Meerut",
    "better value at the same willow grade",
    "comes pre-knocked, which saves you a week of prep",
    "less established than SG or SS",
    "a few reviews mention loose handles",
  ],
  fixes: [
    {
      title: "Get into the “best bat under ₹10,000” lists",
      why: "You were missing from 12 of 18 answers to discovery questions. Those answers repeat the same names that appear in Indian review roundups and marketplace bestseller lists.",
      action: "Send your Club 4 and Junior Pro to five Indian cricket gear reviewers and YouTube channels. Make sure every Amazon and Flipkart listing states the willow grade and price in the title.",
    },
    {
      title: "Publish a durability page with real numbers",
      why: "No model mentioned you when shoppers asked which bats last. SG, SS and Kookaburra were named for quality control and warranty.",
      action: "Add a page that covers willow grade, how each bat is knocked in, warranty length, and your crack and handle replacement policy. Link to it from every product page.",
    },
    {
      title: "Answer the loose-handle complaint in public",
      why: "All three models repeated reports of handles loosening. It is the main negative thing AI says about you.",
      action: "Explain what you changed in production and how the handle warranty works, on your site and in replies to reviews. Ask recent buyers to review after a full season.",
    },
  ],
});

/* ── Lattu Toys: wooden toys, score 0 ─────────────────────────────────────── */

const NOT_KNOWN = null;

const lattuToys = finalize({
  id: "lattu-toys",
  brand: "Lattu Toys",
  category: "Wooden toys",
  country: "India",
  createdAt: "2026-10-13T18:05:00+05:30",
  score: 0,
  verdict: "AI doesn't bring you up yet. Shoppers asking about wooden toys hear about Shumee instead.",
  competitors: ["Shumee", "Funskool", "Skillmatics"],
  sentiment: "neutral",
  queries: [
    {
      id: 1,
      type: "discovery",
      intent: "best overall",
      text: "best wooden toys brand in india for toddlers",
      results: [
        r("ChatGPT", NOT_KNOWN, ["Shumee", "Funskool"], "Shumee is a popular Indian brand for wooden toddler toys, with stacking and sorting sets. Funskool's wooden range is easier to find in shops."),
        r("Gemini", NOT_KNOWN, ["Shumee", "Skillmatics"], "Shumee is the go-to for wooden toys in India. For slightly older kids, Skillmatics makes good learning games, though most are not wooden."),
        r("Claude", NOT_KNOWN, ["Shumee"], "Shumee is the best-known Indian wooden toy brand online. Channapatna toys from Karnataka are another good option if you want traditional, handmade pieces."),
      ],
    },
    {
      id: 2,
      type: "discovery",
      intent: "budget",
      text: "wooden toys under 1000 rs that dont look cheap",
      results: [
        r("ChatGPT", NOT_KNOWN, ["Shumee"], "Shumee has several sets under ₹1,000, like stacking rings and shape sorters. Channapatna toys on government craft sites are also affordable and well made."),
        r("Gemini", NOT_KNOWN, ["Funskool"], "Funskool's wooden puzzles start well under ₹1,000. Check that the paint is labelled non-toxic."),
        r("Claude", NOT_KNOWN, [], "Look for Channapatna toys or small Indian makers on Amazon with lacquer finishes. Under ₹1,000, puzzles and pull-along toys give the best value."),
      ],
    },
    {
      id: 3,
      type: "discovery",
      intent: "gifting",
      text: "1st birthday gift wooden toy ideas, budget 1500",
      results: [
        r("ChatGPT", NOT_KNOWN, ["Shumee", "Skillmatics"], "A wooden walker or stacking set from Shumee works well for a first birthday. Skillmatics is better once they're a bit older."),
        r("Gemini", NOT_KNOWN, ["Shumee"], "Shumee's wooden activity cube is a popular first-birthday gift in that range."),
        r("Claude", NOT_KNOWN, ["Funskool", "Shumee"], "Funskool's wooden pull-along toys or a Shumee rainbow stacker both fit your budget and suit a one-year-old."),
      ],
    },
    {
      id: 4,
      type: "discovery",
      intent: "safety",
      text: "are wooden toys from india safe? worried about the paint",
      results: [
        r("ChatGPT", NOT_KNOWN, [], "Toys sold in India must carry the BIS mark, which covers paint safety. Look for that, and for “non-toxic, lead-free paint” on the label."),
        r("Gemini", NOT_KNOWN, ["Shumee"], "Established brands like Shumee use water-based, non-toxic paints and carry BIS certification."),
        r("Claude", NOT_KNOWN, [], "Wooden toys with the BIS mark meet Indian safety standards. Traditional Channapatna toys use vegetable dyes and lac, which are generally considered safe."),
      ],
    },
    {
      id: 5,
      type: "discovery",
      intent: "made in India",
      text: "made in india toy brands, non plastic, channapatna type",
      results: [
        r("ChatGPT", NOT_KNOWN, ["Shumee"], "Shumee is the best-known option. Also look for Channapatna cooperatives that sell online."),
        r("Gemini", NOT_KNOWN, ["Shumee", "Funskool"], "Shumee and Funskool both make toys in India, and Shumee focuses on wooden ones."),
        r("Claude", NOT_KNOWN, ["Shumee"], "Shumee works with Channapatna artisans and is a good place to start."),
      ],
    },
    {
      id: 6,
      type: "discovery",
      intent: "wood vs plastic",
      text: "wooden vs plastic toys for 2 year old, which is actually better",
      results: [
        r("ChatGPT", NOT_KNOWN, [], "Wooden toys last longer and encourage open-ended play, but plastic toys are often cheaper and easier to clean. A mix is fine."),
        r("Gemini", NOT_KNOWN, [], "Wooden toys are more durable and free of BPA. Plastic toys offer more variety. For a 2-year-old, simple wooden toys are a good base."),
        r("Claude", NOT_KNOWN, ["Skillmatics"], "Material matters less than design at this age. Simple wooden toys are great; Skillmatics-style activity sets come in later."),
      ],
    },
    {
      id: 7,
      type: "brand_check",
      intent: "reputation",
      text: "lattu toys reviews? are they safe for babies",
      results: [
        r("ChatGPT", NOT_KNOWN, [], "I don't have reliable information about Lattu Toys. Check for a BIS mark and read recent reviews on Amazon or Flipkart."),
        r("Gemini", NOT_KNOWN, [], "I couldn't find much information about Lattu Toys. For babies, check the age rating and make sure there are no small parts."),
        r("Claude", NOT_KNOWN, ["Shumee"], "I'm not familiar with Lattu Toys. If you want a well-reviewed option, Shumee publishes its safety certification."),
      ],
    },
    {
      id: 8,
      type: "brand_check",
      intent: "price",
      text: "lattu toys overpriced?",
      results: [
        r("ChatGPT", NOT_KNOWN, [], "I don't have enough information about Lattu Toys' pricing to judge. Compare with similar wooden toys and check what finish and certification you're paying for."),
        r("Gemini", NOT_KNOWN, ["Shumee", "Funskool"], "I don't have pricing data for Lattu Toys. Shumee and Funskool are useful price benchmarks for similar wooden toys."),
        r("Claude", NOT_KNOWN, [], "I can't say, as I don't know much about Lattu Toys. Premium wooden toys often cost more because of handmade finishing."),
      ],
    },
    {
      id: 9,
      type: "comparison",
      intent: "vs Shumee",
      text: "lattu toys vs shumee wooden toys",
      results: [
        r("ChatGPT", NOT_KNOWN, ["Shumee"], "Shumee is well established with many reviews. I don't have reliable information about Lattu Toys, so Shumee is the safer choice based on what's known."),
        r("Gemini", NOT_KNOWN, ["Shumee"], "Shumee is the more recognised brand. I couldn't find enough about Lattu Toys to compare."),
        r("Claude", NOT_KNOWN, ["Shumee"], "I know Shumee well but not Lattu Toys. If Lattu has BIS certification and good reviews, it could be a fine alternative."),
      ],
    },
    {
      id: 10,
      type: "comparison",
      intent: "vs Funskool",
      text: "lattu or funskool for a 3 yr old gift",
      results: [
        r("ChatGPT", NOT_KNOWN, ["Funskool"], "Funskool is a long-standing Indian brand with a wide range for 3-year-olds. I don't know much about Lattu Toys."),
        r("Gemini", NOT_KNOWN, ["Funskool"], "Funskool is easier to find and has a long track record. Lattu Toys doesn't appear widely in reviews."),
        r("Claude", NOT_KNOWN, ["Funskool"], "Funskool is the safer, better-known choice. I'm not familiar with Lattu Toys' range."),
      ],
    },
  ],
  descriptors: [],
  fixes: [
    {
      title: "Get into the lists AI reads",
      why: "Most answers to discovery questions named Shumee, Funskool or Channapatna crafts. These answers draw on gift guides, parenting blogs and marketplace bestseller lists, and you aren't in them yet.",
      action: "Before Diwali, send your three best-selling toys to five Indian parenting bloggers and gift-guide writers. Ask to be included in their “best wooden toys” lists.",
    },
    {
      title: "Say what you are, in plain words",
      why: "When asked about Lattu Toys by name, all three models said they had little or no information about you.",
      action: "Make your About page and product pages state: wooden toys, made in India, age range, BIS certification number and paint type. Use the same wording on Amazon and Flipkart.",
    },
    {
      title: "Put your safety certification up front",
      why: "Two of the ten questions were about safety, and the models pointed parents to brands that show their BIS certification.",
      action: "Show your BIS mark and paint test results on every product page, and publish a single safety page that answers the questions parents ask.",
    },
  ],
});

export const sampleReports: Record<string, Report> = {
  [creaseAndCo.id]: creaseAndCo,
  [lattuToys.id]: lattuToys,
};

export const DEMO_REPORT_ID = creaseAndCo.id;
export const ZERO_DEMO_REPORT_ID = lattuToys.id;
