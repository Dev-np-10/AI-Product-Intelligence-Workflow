# Voice Pulse — ChatGPT Mobile Voice Review Workflow

A complete, demo-ready workflow that ingests a CSV of genuine public mobile reviews for ChatGPT
Voice Mode, runs automated data-quality checks, surfaces the top 3 themes with verbatim quotes,
extracts fee-related evidence, produces a Weekly Product Pulse (<=250 words) and a neutral fee
explainer (<=6 bullets, 2 verified official sources), and gates every external write (Google Docs,
Notion, email draft) behind explicit human approval.

Emails are **never** sent automatically — the email action only ever creates a draft.

All external integrations use **mock executors** in this demo, so no real Google Docs, Notion, or
email account is contacted. This makes the workflow safe to run in tests and demos.

## Features

1. **CSV upload** — drag-and-drop or file picker, plus a built-in sample dataset.
   Required columns: `author, date, rating, title, body, source`.
2. **Data-quality checks** — valid rows, duplicates, malformed dates, invalid ratings, missing
   required content, rating distribution, date range. Issues are listed inline.
3. **Top 3 themes** — ranked by review count, each with its keyword set and a verbatim
   representative quote (verified against the source rows in tests).
4. **Fee-related evidence** — every review mentioning fees, pricing, subscriptions, or charges is
   shown with author, date, rating, and sentiment. "Insufficient evidence" is flagged when fewer
   than 3 reviews mention fees.
5. **Weekly Product Pulse** — <=250 words, with an inline word counter and a warning if the limit
   is exceeded.
6. **Neutral fee explainer** — <=6 bullets, plus 2 verified official OpenAI sources. Source links
   are validated against an allowlist of official domains over HTTPS.
7. **Approval gate** — every external write action (Google Docs, Notion, email draft) must be
   explicitly checked and then run. Unapproved actions do nothing. Clear success/failure messages
   are shown per action.
8. **Validation tests** — a one-click test runner (also runnable from the CLI) covers every
   scenario below using mock integrations. No real external writes occur during tests.

## Setup

Requirements: Node.js 18+ and npm.

```bash
npm install
```

## Run the app (dev server)

```bash
npm run dev
```

Then open the printed local URL. Click "Load sample dataset" to see the full workflow end-to-end,
or upload your own CSV with the required columns.

## Production build

```bash
npm run build
npm run preview
```

## Run the validation tests

The tests are pure TypeScript and use mock executors only — they never contact external systems.

### Option A — in the UI

Open the app and click **Run tests** in the "Validation Tests" panel. A pass/fail report is shown
inline.

### Option B — from the command line

```bash
npm run test:build
npm run test:run
```

`test:build` compiles the test sources to `dist-test/`, and `test:run` executes the runner. The
runner prints a per-test PASS/FAIL report and exits with code 0 when all tests pass, non-zero on
any failure.

### What the tests cover

- Valid CSV upload and missing/invalid columns.
- Empty datasets, duplicate reviews, malformed dates, invalid ratings.
- Theme counts, top-3 ranking, and verbatim quote accuracy.
- Insufficient fee evidence and unsupported claims.
- Pulse word limit (<=250), explainer bullet limit (<=6), and source-link validation (official
  domain + HTTPS + title present; non-official domains rejected).
- Approval gating: unapproved actions execute nothing; only approved actions run.
- Email is never auto-sent — the email-draft action only returns a draft reference.
- MCP failures (simulated) and partial action failures (mixed success/failure handled
  per-action).

## Project layout

```
src/
  App.tsx                     # main screen, wires everything together
  types.ts                    # shared types and constants
  lib/
    csvParser.ts              # RFC-style CSV parser with quote handling
    dataQuality.ts            # data-quality report builder
    analysis.ts               # themes, fee evidence, pulse, fee explainer
    mcp.ts                    # mock MCP actions + approval-gated executor
    sources.ts                # official-source URL allowlist validation
    sampleData.ts             # built-in sample CSV
    validationTests.ts        # the test suite (UI + CLI)
    runTests.ts               # CLI entry point (TypeScript)
  components/
    UploadPanel.tsx
    DataQualityPanel.tsx
    ThemesPanel.tsx
    FeeEvidencePanel.tsx
    PulsePanel.tsx
    FeeExplainerPanel.tsx
    ApprovalGatePanel.tsx
    ValidationPanel.tsx
scripts/
  run-tests.mjs               # CLI entry point (compiled JS)
```

## Notes on safety

- No real Google Docs, Notion, or email credentials are required or used.
- The email action creates a **draft** only. It is never sent automatically.
- External writes require an explicit checkbox + button press per action.
- All tests use mock executors; no test run performs a real external write.
