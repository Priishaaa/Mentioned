import type { ReportInput } from "@mentioned/shared";

export function questionsPrompt({ brand, website, category, country, competitors }: ReportInput): string {
  return `You are generating realistic questions that shoppers ask AI assistants
(ChatGPT, Gemini, Claude) when deciding what to buy. These questions will
be sent to AI models to measure how often a brand appears in their answers.

BRAND: ${brand}${website ? `\nWEBSITE: ${website} (use it only to understand which company this is)` : ""}
CATEGORY: ${category}
COUNTRY: ${country}
COMPETITORS: ${competitors.join(", ") || "(none given: use \"popular alternatives\")"}

Generate exactly 10 questions:

DISCOVERY (6): the shopper does not know ${brand}.
- Never name ${brand} or any other brand.
- Exactly one question per intent, in this order:
  best-overall, budget, use-case (e.g. beginners, gifting), quality/durability,
  local ("made in ${country}" or buying locally), type/feature comparison.
- Use ${country}'s currency and realistic prices where a shopper would.

BRAND CHECK (2): the shopper has heard of ${brand}.
- One neutral question about reputation or value, and one skeptical one
  (complaints, downsides, "is it overhyped").
- Mention the category with the brand so the question can't be confused
  with another company that has the same name.

COMPARISON (2): ${brand} vs. a competitor.
- Use a different competitor in each question if there are 2 or more.

Style:
- Write the way people actually type: casual, sometimes short or lowercase,
  sometimes missing punctuation. Use natural Indian-English phrasing
  if the country is India.
- No marketing language. Do not answer the questions.
- Each question must have a different intent, not just different wording.

Number the questions 1-10 in the order above. "intent" is a 1-2 word lowercase label
a founder would understand, e.g. "budget", "beginner", "made in India", "vs SG".`;
}

export function readAnswersPrompt(args: {
  brand: string;
  website: string;
  category: string;
  answers: { id: number; queryType: string; question: string; answer: string }[];
}): string {
  const blocks = args.answers
    .map((a) => `<answer id="${a.id}" question_type="${a.queryType}">
QUESTION: ${a.question}

${a.answer}
</answer>`)
    .join("\n\n");
  return `You are reading AI assistants' answers to shoppers' questions, to record how one brand appears in each.

BRAND BEING MEASURED: ${args.brand}${args.website ? ` (${args.website})` : ""}
CATEGORY: ${args.category}

${blocks}

Return one reading per answer, with its answer_id. For each answer record:
- brands: every brand or company the answer names as something to buy or consider, in order of first
  appearance, written as the answer writes them. Leave out retailers and marketplaces (Amazon, Flipkart,
  etc.) unless they're recommended as the product's brand. Include ${args.brand} if named.
- brand_named: true if ${args.brand} is named anywhere in the answer, under any spelling.
- brand_known: false if the answer says it doesn't know ${args.brand} or has little or no information
  about it; otherwise true.
- descriptors: up to 3 short phrases copied word for word from the answer (each under 12 words) that
  describe ${args.brand}. Empty if it isn't described.
- sentiment: the answer's tone toward ${args.brand}: positive, neutral or negative. Neutral if not named.
- excerpt: one to three consecutive sentences copied word for word from the answer, under 60 words,
  that best show what it told the shopper. If ${args.brand} is named, include the sentence that names it.

Judge each answer on its own text only.`;
}

export function summaryPrompt(args: { brand: string; category: string; country: string; facts: string }): string {
  return `You are writing the summary of an "AI visibility" report for the founder of ${args.brand},
a ${args.category} brand in ${args.country}. We asked AI assistants ten shopper questions and recorded
whether they named ${args.brand}. Here is what we found:

${args.facts}

Write:
- verdict: one plain sentence (under 16 words) a founder would understand at a glance, about how
  visible ${args.brand} is when shoppers don't already know its name. No jargon, no exclamation marks.
- fixes: exactly three specific, practical actions ranked by likely impact on being named by AI
  assistants. Each has:
  - title: under 9 words, starts with a verb.
  - why: one or two sentences grounded only in the findings above. Quote numbers from them where useful.
  - action: one or two sentences saying concretely what to do this month.

Only use facts from the findings. Don't invent reviews, prices, sales figures or product names.
Write in plain English for a busy founder.`;
}
