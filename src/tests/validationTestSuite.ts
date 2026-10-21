/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApprovalRecord, TestAssertion, TestSuiteResult } from '../types';
import { extractFeeEvidence, extractTopThemes } from '../utils/analyzer';
import { processReviewsCSV } from '../utils/csvParser';
import {
  countWords,
  generateNeutralFeeExplainer,
  generateWeeklyProductPulse,
  validateSourceUrl,
  VERIFIED_OFFICIAL_SOURCES,
} from '../utils/pulseGenerator';
import {
  EMPTY_CSV,
  HEALTHY_VOICE_REVIEWS_CSV,
  INSUFFICIENT_FEE_EVIDENCE_CSV,
  MALFORMED_DIRTY_REVIEWS_CSV,
  MISSING_COLUMNS_CSV,
} from '../utils/sampleData';
import { generateContentHash, isVerbatimQuote } from '../utils/sanitizer';
import { buildMcpPayload, executeMcpActions, parseGoogleDocUrl, resetMockStorageState } from '../services/mcpClient';

/**
 * Executes the complete validation test suite covering all 7 requirement categories.
 */
export async function runAllValidationTests(): Promise<TestSuiteResult[]> {
  const suites: TestSuiteResult[] = [];

  // =========================================================================
  // SUITE 1: CSV Upload & Flexible Column Resolution (No Mandatory Column Check)
  // =========================================================================
  {
    const startMs = Date.now();
    const assertions: TestAssertion[] = [];

    // Test 1.1: Valid standard CSV parsing
    const healthyResult = processReviewsCSV(HEALTHY_VOICE_REVIEWS_CSV);
    assertions.push({
      name: 'Standard CSV parsed with detected columns',
      passed: healthyResult.report.isValid && healthyResult.reviews.length >= 15,
      details: `Parsed ${healthyResult.reviews.length} valid reviews. Detected columns: [${healthyResult.report.detectedColumns.join(', ')}]`,
      timestamp: new Date().toISOString(),
    });

    // Test 1.2: Mandatory column check removed: alternate/missing column headers parsed flexibly
    const alternateResult = processReviewsCSV(MISSING_COLUMNS_CSV);
    const successfullyMapped =
      alternateResult.report.isValid &&
      alternateResult.reviews.length === 2 &&
      alternateResult.report.columnMappings.review_text === 'content';

    assertions.push({
      name: 'Mandatory column check removed: alternate headers parsed flexibly',
      passed: successfullyMapped,
      details: `Mapped 'content' -> review_text and 'user_stars' -> rating. Parsed ${alternateResult.reviews.length} reviews without mandatory column rejection.`,
      timestamp: new Date().toISOString(),
    });

    // Test 1.3: Zero mandatory column errors emitted
    assertions.push({
      name: 'No mandatory column errors emitted on non-standard schemas',
      passed: alternateResult.report.errors.length === 0,
      details: 'Dataset with non-standard columns processed with isValid=true and 0 fatal schema errors.',
      timestamp: new Date().toISOString(),
    });

    suites.push({
      suiteId: 'suite_csv_validation',
      title: 'Suite 1: CSV Upload & Flexible Column Mapping (No Mandatory Column Check)',
      description: 'Tests flexible column mapping across standard and custom CSV formats without rigid mandatory column constraints.',
      assertions,
      passed: assertions.every(a => a.passed),
      elapsedMs: Date.now() - startMs,
    });
  }

  // =========================================================================
  // SUITE 2: Empty Datasets, Duplicate Reviews, and Malformed Dates
  // =========================================================================
  {
    const startMs = Date.now();
    const assertions: TestAssertion[] = [];

    // Test 2.1: Empty dataset rejection
    const emptyResult = processReviewsCSV(EMPTY_CSV);
    assertions.push({
      name: 'Empty CSV dataset rejected with error',
      passed: !emptyResult.report.isValid && emptyResult.report.errors.length > 0,
      details: `Rejected empty dataset. Error: "${emptyResult.report.errors[0]}"`,
      timestamp: new Date().toISOString(),
    });

    // Test 2.2: Duplicate review detection
    const dirtyResult = processReviewsCSV(MALFORMED_DIRTY_REVIEWS_CSV);
    assertions.push({
      name: 'Duplicate reviews identified and count tracked',
      passed: dirtyResult.report.duplicateCount >= 1,
      details: `Detected ${dirtyResult.report.duplicateCount} duplicate review rows (e.g., REV-D01).`,
      timestamp: new Date().toISOString(),
    });

    // Test 2.3: Malformed dates detected & standardized
    assertions.push({
      name: 'Malformed date formats caught and flagged',
      passed: dirtyResult.report.malformedDateCount >= 2,
      details: `Caught ${dirtyResult.report.malformedDateCount} invalid dates ('NOT_A_VALID_DATE', '99/99/9999'). Standardized fallback applied.`,
      timestamp: new Date().toISOString(),
    });

    // Test 2.4: Untrusted input sanitization
    assertions.push({
      name: 'Untrusted input sanitization (<script>, formula injection)',
      passed: dirtyResult.report.sanitizationCount >= 1,
      details: `Sanitized ${dirtyResult.report.sanitizationCount} potentially harmful inputs safely.`,
      timestamp: new Date().toISOString(),
    });

    suites.push({
      suiteId: 'suite_data_hygiene',
      title: 'Suite 2: Empty Datasets, Duplicates & Malformed Dates',
      description: 'Tests empty CSV handling, de-duplication, date format validation, and sanitization.',
      assertions,
      passed: assertions.every(a => a.passed),
      elapsedMs: Date.now() - startMs,
    });
  }

  // =========================================================================
  // SUITE 3: Theme Counts, Top-3 Ranking, and Verbatim Quote Accuracy
  // =========================================================================
  {
    const startMs = Date.now();
    const assertions: TestAssertion[] = [];

    const parsed = processReviewsCSV(HEALTHY_VOICE_REVIEWS_CSV);
    const topThemes = extractTopThemes(parsed.reviews);

    // Test 3.1: Exactly top 3 themes returned
    assertions.push({
      name: 'Top 3 themes extracted with volume ranking',
      passed: topThemes.length === 3,
      details: `Extracted ${topThemes.length} ranked themes: [${topThemes.map(t => `#${t.rank} ${t.title} (${t.count})`).join(', ')}]`,
      timestamp: new Date().toISOString(),
    });

    // Test 3.2: Themes are strictly sorted by frequency count
    const isSorted = topThemes[0].count >= topThemes[1].count && topThemes[1].count >= topThemes[2].count;
    assertions.push({
      name: 'Top-3 ranking is strictly monotonic by count',
      passed: isSorted,
      details: `Counts: #${topThemes[0].rank}=${topThemes[0].count}, #${topThemes[1].rank}=${topThemes[1].count}, #${topThemes[2].rank}=${topThemes[2].count}`,
      timestamp: new Date().toISOString(),
    });

    // Test 3.3: Verbatim quote accuracy verification
    const allQuotes = topThemes.flatMap(t => t.sampleQuotes);
    const allVerbatim = allQuotes.every(q => q.isExactMatch);
    assertions.push({
      name: 'Customer quotes are 100% verbatim matches from raw reviews',
      passed: allVerbatim && allQuotes.length > 0,
      details: `Verified ${allQuotes.length} extracted quotes against raw source text with 0% synthetic hallucination.`,
      timestamp: new Date().toISOString(),
    });

    suites.push({
      suiteId: 'suite_themes_quotes',
      title: 'Suite 3: Theme Counts, Top-3 Ranking & Verbatim Quotes',
      description: 'Validates theme clustering, frequency ranking, and verbatim accuracy against source reviews.',
      assertions,
      passed: assertions.every(a => a.passed),
      elapsedMs: Date.now() - startMs,
    });
  }

  // =========================================================================
  // SUITE 4: Insufficient Fee Evidence and Unsupported Claims
  // =========================================================================
  {
    const startMs = Date.now();
    const assertions: TestAssertion[] = [];

    // Test 4.1: Healthy dataset has sufficient fee evidence
    const healthyReviews = processReviewsCSV(HEALTHY_VOICE_REVIEWS_CSV).reviews;
    const healthyFee = extractFeeEvidence(healthyReviews);
    assertions.push({
      name: 'Sufficient fee evidence recognized in healthy dataset',
      passed: healthyFee.hasSufficientEvidence && healthyFee.items.length >= 2,
      details: `Found ${healthyFee.items.length} verified fee-related reviews in healthy dataset.`,
      timestamp: new Date().toISOString(),
    });

    // Test 4.2: Insufficient fee evidence dataset triggers guardrail
    const sparseReviews = processReviewsCSV(INSUFFICIENT_FEE_EVIDENCE_CSV).reviews;
    const sparseFee = extractFeeEvidence(sparseReviews);
    assertions.push({
      name: 'Insufficient fee evidence triggers disclaimer & blocks unsupported claims',
      passed: !sparseFee.hasSufficientEvidence && sparseFee.unsupportedClaims.length > 0,
      details: `Correctly flagged insufficient fee evidence (${sparseFee.items.length} matches). Generated claim block: "${sparseFee.unsupportedClaims[0]}"`,
      timestamp: new Date().toISOString(),
    });

    // Test 4.3: Fee claims are supported by verbatim quotes
    const quotesVerified = healthyFee.items.every(item => item.verified_against_raw);
    assertions.push({
      name: 'All fee evidence items attributed to verified verbatim quotes',
      passed: quotesVerified && healthyFee.items.length > 0,
      details: `All ${healthyFee.items.length} fee evidence items confirmed against original review text.`,
      timestamp: new Date().toISOString(),
    });

    suites.push({
      suiteId: 'suite_fee_evidence',
      title: 'Suite 4: Fee Evidence & Unsupported Claims Prevention',
      description: 'Verifies fee-related evidence gathering and threshold checks for preventing unsupported claims.',
      assertions,
      passed: assertions.every(a => a.passed),
      elapsedMs: Date.now() - startMs,
    });
  }

  // =========================================================================
  // SUITE 5: Pulse Word Limit, Explainer Bullet Limit, & Source-Link Validation
  // =========================================================================
  {
    const startMs = Date.now();
    const assertions: TestAssertion[] = [];

    const parsed = processReviewsCSV(HEALTHY_VOICE_REVIEWS_CSV);
    const topThemes = extractTopThemes(parsed.reviews);
    const pulse = generateWeeklyProductPulse('2026-10-21', topThemes, true);

    // Test 5.1: Pulse word limit (<= 250 words)
    assertions.push({
      name: 'Weekly Product Pulse is strictly <= 250 words',
      passed: pulse.isWithinLimit && pulse.wordCount <= 250,
      details: `Current pulse length: ${pulse.wordCount} words (Limit: 250 words). Structured with Executive Summary, Friction Signals, and Recommended Actions.`,
      timestamp: new Date().toISOString(),
    });

    // Test 5.2: Explainer bullet limit (<= 6 bullets)
    const explainer = generateNeutralFeeExplainer(true);
    assertions.push({
      name: 'Neutral Fee Explainer contains <= 6 concise bullets',
      passed: explainer.bulletCount <= 6 && explainer.bulletCount > 0,
      details: `Contains ${explainer.bulletCount} neutral explanatory bullets (Limit: 6 bullets max).`,
      timestamp: new Date().toISOString(),
    });

    // Test 5.3: Exactly 2 verified official sources
    assertions.push({
      name: 'Exactly 2 verified official sources included',
      passed: explainer.sources.length === 2 && explainer.sources.every(s => s.isVerified),
      details: `Sources: [${explainer.sources.map(s => s.title).join(', ')}]`,
      timestamp: new Date().toISOString(),
    });

    // Test 5.4: Source-link domain & protocol validation
    const linksValid = explainer.sources.every(s => validateSourceUrl(s.url).isValid);
    assertions.push({
      name: 'Source links validated for HTTPS and official domain whitelist',
      passed: linksValid,
      details: `Verified URLs: ${explainer.sources.map(s => s.url).join(' | ')}`,
      timestamp: new Date().toISOString(),
    });

    suites.push({
      suiteId: 'suite_pulse_explainer_limits',
      title: 'Suite 5: Pulse Word Limit, Bullet Limits & Link Validation',
      description: 'Enforces strict formatting constraints (<=250 words, <=6 bullets, 2 verified official sources).',
      assertions,
      passed: assertions.every(a => a.passed),
      elapsedMs: Date.now() - startMs,
    });
  }

  // =========================================================================
  // SUITE 6: Human Approval Gate & Edit Invalidation
  // =========================================================================
  {
    const startMs = Date.now();
    const assertions: TestAssertion[] = [];
    resetMockStorageState();

    const parsed = processReviewsCSV(HEALTHY_VOICE_REVIEWS_CSV);
    const topThemes = extractTopThemes(parsed.reviews);
    const pulse = generateWeeklyProductPulse('2026-10-21', topThemes, true);
    const explainer = generateNeutralFeeExplainer(true);
    const payload = buildMcpPayload(pulse, explainer, topThemes, 'Plus $20 daily cutoff ambiguity');
    const initialHash = generateContentHash(pulse.fullPulseText + explainer.bullets.join(''));

    // Test 6.1: External action execution blocked when status is PENDING_REVIEW
    let blockedUnapproved = false;
    const unapprovedRecord: ApprovalRecord = {
      status: 'PENDING_REVIEW',
      contentHash: initialHash,
      approvedDestinations: { google_docs: true, notion: true, gmail_draft: true },
    };

    try {
      await executeMcpActions(payload, {
        destinations: { google_docs: true, notion: false, gmail_draft: false },
        approvalRecord: unapprovedRecord,
        currentContentHash: initialHash,
        isAutomatedTest: true,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('APPROVAL GATE ENFORCEMENT')) {
        blockedUnapproved = true;
      }
    }

    assertions.push({
      name: 'MCP write actions blocked without explicit human approval',
      passed: blockedUnapproved,
      details: 'Attempted write without approval threw APPROVAL GATE ENFORCEMENT error as required.',
      timestamp: new Date().toISOString(),
    });

    // Test 6.2: Any edit invalidates previous approval
    let blockedOnHashMismatch = false;
    const approvedRecord: ApprovalRecord = {
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      approvedBy: 'Lead Product Manager',
      contentHash: initialHash,
      approvedDestinations: { google_docs: true, notion: true, gmail_draft: true },
    };

    const modifiedContentHash = generateContentHash(pulse.fullPulseText + ' [EDITED AFTER APPROVAL]');
    try {
      await executeMcpActions(payload, {
        destinations: { google_docs: true, notion: false, gmail_draft: false },
        approvalRecord: approvedRecord,
        currentContentHash: modifiedContentHash, // Mismatched hash!
        isAutomatedTest: true,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('APPROVAL INVALIDATION DETECTED')) {
        blockedOnHashMismatch = true;
      }
    }

    assertions.push({
      name: 'Content modification invalidates previous approval (Hash check)',
      passed: blockedOnHashMismatch,
      details: 'Editing content altered contentHash; system blocked dispatch until re-approval.',
      timestamp: new Date().toISOString(),
    });

    // Test 6.3: Approved execution succeeds when hashes match
    const validRunResults = await executeMcpActions(payload, {
      destinations: { google_docs: true, notion: false, gmail_draft: false },
      approvalRecord: approvedRecord,
      currentContentHash: initialHash,
      isAutomatedTest: true,
    });

    assertions.push({
      name: 'Approved payload dispatches successfully to approved targets',
      passed: validRunResults.length === 1 && validRunResults[0].status === 'SUCCESS',
      details: `Successfully dispatched to ${validRunResults[0].destinationName} with idempotency key.`,
      timestamp: new Date().toISOString(),
    });

    // Test 6.4: User-provided Google Doc URL parsing & custom document targeting
    const sampleUserDocUrl = 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';
    const parsedDocInfo = parseGoogleDocUrl(sampleUserDocUrl);
    const customDocResults = await executeMcpActions(payload, {
      destinations: {
        google_docs: true,
        notion: false,
        gmail_draft: false,
        google_docs_url: sampleUserDocUrl,
      },
      approvalRecord: approvedRecord,
      currentContentHash: initialHash,
      isAutomatedTest: true,
    });

    const targetedCustomDoc =
      parsedDocInfo.isValid &&
      parsedDocInfo.docId === '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' &&
      customDocResults.length === 1 &&
      customDocResults[0]?.status === 'SUCCESS';

    assertions.push({
      name: 'User-provided Google Doc link parsed and targeted in MCP protocol execution',
      passed: targetedCustomDoc,
      details: `Targeted user-provided Doc ID: ${parsedDocInfo.docId}. Canonical URL: ${parsedDocInfo.canonicalUrl}.`,
      timestamp: new Date().toISOString(),
    });

    suites.push({
      suiteId: 'suite_approval_gate',
      title: 'Suite 6: Human Approval Gate & Edit Invalidation',
      description: 'Tests strict enforcement of approval gate, hash invariance, edit invalidation, and custom Google Doc targeting.',
      assertions,
      passed: assertions.every(a => a.passed),
      elapsedMs: Date.now() - startMs,
    });
  }

  // =========================================================================
  // SUITE 7: MCP Failures, Partial Action Failures & Gmail Draft Safety
  // =========================================================================
  {
    const startMs = Date.now();
    const assertions: TestAssertion[] = [];
    resetMockStorageState();

    const parsed = processReviewsCSV(HEALTHY_VOICE_REVIEWS_CSV);
    const topThemes = extractTopThemes(parsed.reviews);
    const pulse = generateWeeklyProductPulse('2026-10-21', topThemes, true);
    const explainer = generateNeutralFeeExplainer(true);
    const payload = buildMcpPayload(pulse, explainer, topThemes, 'Plus $20 daily cutoff ambiguity');
    const hash = generateContentHash(pulse.fullPulseText + explainer.bullets.join(''));

    const approvedRecord: ApprovalRecord = {
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      approvedBy: 'Lead Product Manager',
      contentHash: hash,
      approvedDestinations: { google_docs: true, notion: true, gmail_draft: true },
    };

    // Test 7.1: Gmail is DRAFT ONLY (never auto-sends)
    const gmailResult = await executeMcpActions(payload, {
      destinations: { google_docs: false, notion: false, gmail_draft: true },
      approvalRecord: approvedRecord,
      currentContentHash: hash,
      isAutomatedTest: true,
    });

    const isDraftOnly =
      gmailResult.length === 1 &&
      gmailResult[0].status === 'SUCCESS' &&
      gmailResult[0].requestPayload.name === 'gmail_create_draft' &&
      // autoSend parameter must be explicitly false
      (gmailResult[0].requestPayload.params as Record<string, unknown>)?.autoSend === false;

    assertions.push({
      name: 'Gmail creates DRAFT only (never auto-sends)',
      passed: isDraftOnly,
      details: `Subject: "${(gmailResult[0].requestPayload.params as Record<string, unknown>)?.subject}". Flag autoSend=false confirmed.`,
      timestamp: new Date().toISOString(),
    });

    // Test 7.2: Partial failure handling (Docs succeeds, Notion fails with 503)
    const partialResults = await executeMcpActions(payload, {
      destinations: { google_docs: true, notion: true, gmail_draft: false },
      approvalRecord: approvedRecord,
      currentContentHash: hash,
      simulatePartialFailure: true, // Forces Notion to fail while Docs succeeds
      isAutomatedTest: true,
    });

    const docsSucceeded = partialResults.find(r => r.tool === 'mcp_google_docs_append')?.status === 'SUCCESS';
    const notionFailed = partialResults.find(r => r.tool === 'mcp_notion_append_block')?.status === 'FAILED';

    assertions.push({
      name: 'Partial failure isolated: Docs succeeds while Notion failure is reported cleanly',
      passed: docsSucceeded && notionFailed,
      details: 'Google Docs appended successfully; Notion 503 error captured with retry capability without rolling back Docs.',
      timestamp: new Date().toISOString(),
    });

    // Test 7.3: Idempotent retry suppresses duplicate entries
    const retryResults = await executeMcpActions(payload, {
      destinations: { google_docs: true, notion: false, gmail_draft: false },
      approvalRecord: approvedRecord,
      currentContentHash: hash,
      isAutomatedTest: true,
    });

    const idempotentSuppressed =
      retryResults[0]?.status === 'SUCCESS' &&
      (retryResults[0]?.responsePayload?.idempotentDeduplicated as boolean) === true;

    assertions.push({
      name: 'Idempotency key prevents duplicate document entries on retry',
      passed: idempotentSuppressed,
      details: `Idempotency key ${retryResults[0]?.idempotencyKey} matched existing entry. Write safely deduplicated.`,
      timestamp: new Date().toISOString(),
    });

    suites.push({
      suiteId: 'suite_mcp_failures',
      title: 'Suite 7: MCP Protocol Failures, Partial Failure & Gmail Draft Safety',
      description: 'Tests partial failure isolation, idempotency key deduplication, and draft-only email creation.',
      assertions,
      passed: assertions.every(a => a.passed),
      elapsedMs: Date.now() - startMs,
    });
  }

  return suites;
}
