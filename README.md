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

## Source List URLs

| Source | URL | Outcome |
|---|---|---|
| Google Play (ChatGPT) | https://play.google.com/store/apps/details?id=com.openai.chatgpt&hl=en_US | Page loads, but only 3 reviews are shown without scrolling "See all reviews". Dated 2025-10-11 (outside window), 2026-09-03 (about image/video upload failures) and 2026-09-13 (general praise and complaint about restrictions). None is about voice, so none were included. |
| Apple App Store reviews | https://apps.apple.com/us/app/chatgpt/id6448311069?see-all=reviews&platform=iphone | Page reachable, but my fetch tool returns summaries only: no verbatim bodies, no star ratings, and dates without years. Cannot meet the verbatim/rating requirement. |
| Apple RSS review feed | https://itunes.apple.com/us/rss/customerreviews/page=1/id=6448311069/sortby=mostrecent/json | Blocked (robots disallow for automated fetch). Shell access to this host was also refused. |
| Trustpilot | https://www.trustpilot.com/review/chatgpt.com | Blocked (robots disallow). Also a web-service review page, not specifically the mobile app. |
| AppFollow | https://appfollow.io/ios/chatgpt/6448311069?country=us | Reachable, but exposes no individual reviews. |
| OpenAI Developer Community (5 posts in 4 threads) | https://community.openai.com/t/voice-mode-has-been-improved-into-something-worselive-voice-sucks/1400762 , https://community.openai.com/t/please-bring-back-the-chatgpt-voice-experience-we-loved-i-really-miss-it/1407214 , https://community.openai.com/t/significant-change-in-chatgpt-s-voice-and-conversational-style/1407204 , https://community.openai.com/t/chatgpt-voice-mode-new-version-speaks-too-fast-and-is-hard-to-interrupt/1407589 | Reachable. Real user posts with author and date; used for the partial file. |
| OpenAI Developer Community, further threads (14 more posts) | https://community.openai.com/t/chatgpt-voice-times-out-in-native-ios-app-but-works-in-safari/1393314 , https://community.openai.com/t/ios-bug-assistant-voice-mode-can-lose-attachments-and-block-text-sending/1399314 , https://community.openai.com/t/standard-voice-mode-is-the-only-mode-that-matters/1402845 , https://community.openai.com/t/voice-in-chatgpt-sol-sounds-like-breeze-in-standard-and-advanced-mode/1406753 , https://community.openai.com/t/gpt-live-1-1-is-rolling-out-with-new-voices-and-better-accents/1406704 | Reachable. Three threads are iOS-app specific (1393314, 1399314, 1406753). Also read but excluded as out of window: https://community.openai.com/t/chatgpt-advanced-voice-mode-is-extremely-slow-on-ios/1385562 (user post 2026-07-02) and https://community.openai.com/t/i-want-to-add-serious-feedback-about-the-current-chatgpt-voice-live-experience/1381176 (2026-05-17). |
| Apple App Store (UK) | https://apps.apple.com/gb/app/chatgpt/id6448311069?see-all=reviews&platform=iphone | Reachable; dated Aug 2026 reviews, but no star ratings or years visible and none about voice (closest: "Please Restore Read Aloud Button", Buggerlugger, 31 Aug). Not included. |
| JustUseApp | https://justuseapp.com/en/app/6448311069/chatgpt/reviews | Reachable; has voice reviews, but no dates and apparently older (early advanced-voice era). Out of window; not included. |
| Sitejabber / SmartCustomer | https://www.smartcustomer.com/reviews/chatgpt.com | Reachable; only 2023-2024 reviews, none about voice. Not included. |
| PissedConsumer | https://chatgpt.pissedconsumer.com/review.html | Blocked by captcha. |
| AppGrooves, Reddit | https://appgrooves.com/app/chatgpt-by-openai , reddit.com | Blocked. |
| Capterra | https://capterra.com/p/10009334/ChatGPT/reviews/ (also `?page=2`, `?sort=most_recent`) | Reachable; per-review 1-5 ratings and dates. Three in-window reviews mention voice or dictation (used in the partial file); same three found on every pass. Reviews the general product, and the page lists only about 25 of 407 reviews, so other in-window voice reviews may exist. |
| TrustRadius | https://www.trustradius.com/products/chatgpt/reviews | Reachable; per-review ratings on a **/10** scale. Page 1 of 3 checked: two in-window reviews (2026-07-28, 8/10; 2026-08-19, 9/10), neither about voice. The one voice mention (Ben Caplan, 2025-10-29) is outside the window. Not converted to the 1-5 schema. Pages 2 to 3 not fully verified. |
| GetApp (Canada) | https://www.getapp.ca/software/2070494/chatgpt | Reachable; ratings out of 5. In-window reviews (2026-07-26, 2026-08-06) don't mention voice. Only page 1 of 18 checked. |
| Techjockey | https://www.techjockey.com/ae/reviews/chatgpt | Reachable; ratings out of 5, but all reviews are from 2024 and none mention voice. |
| Kimola (Google Play analysis) | https://kimola.com/reports/unlock-chatgpt-app-insights-a-comprehensive-review-analysis-google-play-en-in-158056 | Aggregate plus 6 featured reviews dated Nov 2025, with no authors or ratings, none about voice. Full data is paywalled. |
| Product Hunt | https://www.producthunt.com/products/chatgpt/reviews | Reachable; reviews have relative dates and no visible per-review rating; none about voice. |
| G2 | https://www.g2.com/products/chatgpt/reviews | Reachable but no individual reviews loaded (aggregate 4.6/5 from 3,108 reviews). |
| MouthShut | https://www.mouthshut.com/product-reviews/ChatGPT-reviews-925995419 | No individual reviews retrievable (aggregate "1/5"). |
| Microsoft Store | https://apps.microsoft.com/detail/9nt1r1c2hh7j | Reviews need JavaScript; none retrieved. |
| Uptodown, Common Sense Media | uptodown.com, commonsensemedia.org | Fetch errors. |

Editorial articles (Engadget, Tom's Guide, chatai.guide, etc.) came up in search. They are journalist or blog opinions, not user reviews, so they were excluded.



## Run locally

```sh
npm install
npm run typecheck
npm run build
npm test
```
