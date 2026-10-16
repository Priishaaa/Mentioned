# Mentioned: web frontend

React + Vite + TypeScript, Tailwind CSS v4, Framer Motion, Recharts, React Router.

Run it from the repo root with `npm run dev`. That starts this app on :5173 and the API on :8787; Vite proxies `/api` to the API. See the [root README](../README.md).

## Pages to try

| URL | Shows |
|---|---|
| `/` | Landing page and form. Submitting runs a check (simulated in demo mode) and opens the report. |
| `/report/crease-and-co` | Sample report, score 41 |
| `/report/lattu-toys` | Score of 0: leads with competitors and fixes |
| `/report/error-demo` | Error state with retry |
| `/report/anything-else` | Report not found |

## Page structure

- **Landing (`/`):** one focused screen with the headline, the form (brand and category; website, country and competitors behind "Add details") and the live demo. Below it, a three-step strip and two example reports.
- **Report (`/report/:id`):** the answer first: brand, verdict, score, and four figures (mention rate, usual position, tone, named most), with Share / PDF / New check. Details sit in tabs (Overview, Competitors, Answers, Fixes). The tab is kept in the URL (`#answers`) and the tab bar sticks while scrolling. Printing shows every tab. A score of 0 opens on Competitors.
- **Link previews:** `public/og.png` is the share image. Once deployed, make the `og:image` meta tag in `index.html` an absolute URL.

## Talking to the backend

All data access is in `src/lib/api.ts`:

- `createReport(input, { onStart, onEvent, signal })` starts a check with `POST /api/reports`. It then follows `/api/reports/:id/events` (Server-Sent Events) and resolves with `{ id, isSample }` when the check finishes.
- `getReport(id, signal)` returns a `Report`, or throws `ReportNotFoundError`.

Types, input validation and the sample reports come from `@mentioned/shared`, the same package the server uses.

## Design

The look is a printed audit report: ink on paper, hairline and heavy rules instead of cards, square corners, no shadows.

Tokens are in `src/styles/index.css`:

- **Colour:** paper and ink neutrals, plus one accent: a highlighter yellow (`--accent`). It sits *behind* the brand's own data (its name in answers, its bars, the band under its score) and is the hover shadow of the main button. It is never used for text. Competitors use `--rival` greys. Light and dark values are both defined there, and the header toggle overrides the OS setting.
- **Type:** Source Serif 4 for headlines, numbers and quoted questions; IBM Plex Sans for UI. The scale is the `--text-*` variables.
- **Spacing:** `--spacing: 8px`, so every Tailwind spacing step is on the 8px grid (`p-1` = 8px, `p-0.5` = 4px).
- **Depth:** hard offset shadows, like a printed sticker, instead of soft blur. `.lift` buttons rise on hover and press on click, `.panel` boxes cast a solid ink shadow, and inputs lift when focused.
- **Motion and interaction:**
  - The highlighter draws itself across the brand's name, the headline and the score as they come into view (`<Mark>`).
  - On the landing page, the live demo types a shopper question and streams each model's answer. You can switch models or pause it. A ticker of real questions runs under the hero and pauses on hover.
  - On the report page:
    - A sticky bar with section links tracks your scroll position.
    - Model rows expand to show which questions named you.
    - The share-of-voice chart has a per-model tooltip.
    - Intents jump to their question.
    - Fixes can be ticked off, and the ticks are saved in this browser.
  - While a report runs, the loader shows a grid of 30 answers filling in.
  - Presets are in `src/lib/motion.ts`. The OS's reduced-motion setting turns off the typing, streaming, ticker, sweeps and lifts.

**Download as PDF** uses `window.print()` with a print stylesheet. It expands every question in the accordion and hides buttons.
