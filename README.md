# Mentioned

Shows a brand how visible it is in AI assistant answers. A founder enters their brand, and the app asks ChatGPT, Gemini and Claude ten shopper questions. The report shows whether the assistants recommend the brand, how they describe it, which competitors come up instead, and what to fix.

## Run it

Requires Node 20.12 or later.

```
npm install
copy .env.example .env      # add your API keys (optional for a first look)
npm run dev
```

Open http://localhost:5173.

- **No keys:** **demo mode**. Checks are simulated and end on the sample report.
- **Free setup:** `GEMINI_API_KEY` (from aistudio.google.com). This measures Gemini, and Gemini also does the analysis: writing the questions, reading the answers and writing the fixes.
- **Paid keys (optional):**
  - `ANTHROPIC_API_KEY` adds Claude as a measured assistant and moves the analysis to Claude.
  - `OPENAI_API_KEY` adds ChatGPT as a measured assistant. (The free GitHub Models route was retired by GitHub on 30 July 2026.)

| Command | Does |
|---|---|
| `npm run dev` | API on :8787 and frontend on :5173, with live reload. The frontend proxies `/api` to the server. |
| `npm test` | Server and scoring tests (no API keys or cost) |
| `npm run typecheck` | Type-checks all three packages |
| `npm run build` then `npm start` | Production: one server on :8787 serves the API and the built frontend |

## Layout

| Folder | What's in it |
|---|---|
| `shared/` | The `Report` types, input validation, the scoring and aggregation logic, and the two sample reports. Used by both sides, so they can't drift apart. |
| `server/` | Hono API and the check pipeline |
| `web/` | React frontend (see [web/README.md](web/README.md)) |

## How a check works

The "analysis model" below is Claude when there's an Anthropic key, otherwise Gemini.

1. **Questions.** The analysis model writes ten shopper questions: six that never name the brand ("discovery"), two about its reputation, and two comparisons with competitors.
2. **Asking.** Every question goes to every assistant with an API key set, in parallel. A model that fails or refuses is skipped for that question. The Claude being measured runs without a refusal fallback, so the results always come from the model named in the report.
3. **Reading.** The analysis model reads the answers in batches of 10 per call and records, for each answer:
   - which brands it names, in order
   - whether it names or knows this brand
   - verbatim phrases describing the brand
   - the tone
   - a short verbatim excerpt

   A plain text match on the brand name backs up the reading.
4. **Scoring** (`shared/src/aggregate.ts`):
   - 85% comes from discovery answers, weighted by position: 1st = 1, 2nd = 0.8, 3rd = 0.6, later = 0.4.
   - 15% comes from brand checks where the model knew the brand.
   - Competitors are the ones the founder listed, topped up with the brands the assistants named most.
5. **Summary.** The analysis model writes the verdict and three fixes, using only the computed findings.

Free tiers limit requests per minute and per day. Rate-limit errors are retried with a wait, and a check stops with a plain-English message if a daily limit runs out.

Progress streams to the browser as Server-Sent Events (`GET /api/reports/:id/events`). If the connection drops, the browser reconnects and the server replays the log. Finished reports are saved as JSON in `server/data/reports/`.

### API

| Route | |
|---|---|
| `POST /api/reports` | Body: `{ brand, website?, category, country?, competitors? }`. Returns `202 { id, models, questionCount }`. Rate-limited per IP. |
| `GET /api/reports/:id/events` | Progress events, ending with `done` or `error` |
| `GET /api/reports/:id` | The report. Returns `202` while the check is still running, `404` if the report is unknown. |
| `GET /api/health` | Whether the server is in demo mode, and which assistants are enabled |

### Cost and limits

- **Calls per check:** 10 answer calls per measured assistant, plus about 4 analysis calls (1 for questions, 1 per 10 answers read, 1 for the summary). On the free setup that's about 14 Gemini calls per check, so the free daily limit allows a handful of checks a day.
- **Rate limit:** `RATE_LIMIT_PER_HOUR` (default 5 checks per IP) protects a public deployment.
- **Analysis model:** set by `ANALYSIS_MODEL`. With an Anthropic key, a cheaper Claude model (e.g. `claude-haiku-5-5`) would cut costs; compare report quality before switching.
- **Privacy:** on Gemini's free tier, Google may use what you send to improve its products. Don't put confidential information through it.

## Not done yet

- **Accounts, history and pricing.**
- **Per-report share images:** every link currently shows the same generic card.
- **Durable job state:** a server restart mid-check loses that check, though finished reports are kept.
- **Production rate limiting:** the limit is in memory, so it resets on restart and isn't shared across instances. Use a shared store if you run more than one server.

The original Python prototype (`doesaiknow/`, `brands/`, `requirements.txt`, `.venv/`) is no longer used by the app.
