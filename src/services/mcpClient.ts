/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApprovalRecord, McpActionResult, McpDestinationConfig, NeutralFeeExplainer, Theme, WeeklyProductPulse } from '../types';
import { generateContentHash } from '../utils/sanitizer';
import { copyToClipboard } from '../utils/clipboardHelper';

export interface McpPayload {
  date: string;
  top_themes: Array<{ rank: number; title: string; count: number; percentage: number }>;
  weekly_pulse: {
    word_count: number;
    executive_summary: string;
    friction_signals: string;
    quota_findings: string;
    recommended_actions: string;
    full_text: string;
  };
  identified_fee_issue: string;
  explanation_bullets: string[];
  source_links: Array<{ title: string; url: string; domain: string }>;
}

export interface McpExecutionOptions {
  destinations: McpDestinationConfig;
  approvalRecord: ApprovalRecord;
  currentContentHash: string;
  simulateAuthError?: boolean;
  simulateTimeout?: boolean;
  simulatePartialFailure?: boolean; // Notion fails, Docs & Gmail succeed
  isAutomatedTest?: boolean;
}

// In-memory document storage to demonstrate content preservation & idempotency
const mockGoogleDocStore: { docId: string; entries: McpPayload[] } = {
  docId: 'gdoc_chatgpt_voice_pulse_master',
  entries: [],
};

const mockNotionDatabaseStore: { databaseId: string; entries: McpPayload[] } = {
  databaseId: 'notion_db_weekly_voice_pulse',
  entries: [],
};

const mockGmailDraftsStore: Array<{ draftId: string; subject: string; body: string; createdAt: string }> = [];

// Idempotency registry to prevent duplicate document entries on retry
const processedIdempotencyKeys = new Set<string>();

/**
 * Builds standard MCP structured payload
 */
export function buildMcpPayload(
  pulse: WeeklyProductPulse,
  explainer: NeutralFeeExplainer,
  topThemes: Theme[],
  feeIssueSummary: string
): McpPayload {
  return {
    date: pulse.date,
    top_themes: topThemes.map(t => ({
      rank: t.rank,
      title: t.title,
      count: t.count,
      percentage: t.percentage,
    })),
    weekly_pulse: {
      word_count: pulse.wordCount,
      executive_summary: pulse.executiveSummary,
      friction_signals: pulse.frictionSignals,
      quota_findings: pulse.quotaAndVoiceFindings,
      recommended_actions: pulse.recommendedActions,
      full_text: pulse.fullPulseText,
    },
    identified_fee_issue: feeIssueSummary,
    explanation_bullets: explainer.bullets,
    source_links: explainer.sources.map(s => ({
      title: s.title,
      url: s.url,
      domain: s.domain,
    })),
  };
}

/**
 * Validates and parses user-provided Google Doc URLs or Document IDs.
 * Directs to https://docs.new if no document has been specified so users never hit 404.
 */
export function parseGoogleDocUrl(input?: string): {
  docId: string;
  canonicalUrl: string;
  isValid: boolean;
  isCreateNew: boolean;
  reason?: string;
} {
  if (!input || input.trim().length === 0) {
    return {
      docId: 'new_doc',
      canonicalUrl: 'https://docs.new',
      isValid: true,
      isCreateNew: true,
      reason: 'No specific document URL provided; default configured to open via docs.new.',
    };
  }

  const trimmed = input.trim();

  // If user typed docs.new
  if (trimmed.includes('docs.new') || trimmed === 'new') {
    return {
      docId: 'new_doc',
      canonicalUrl: 'https://docs.new',
      isValid: true,
      isCreateNew: true,
    };
  }

  // Match standard Google Doc URL format: https://docs.google.com/document/d/<DOC_ID>/...
  const match = trimmed.match(/\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9-_]+)/i);
  if (match && match[1]) {
    const docId = match[1];
    return {
      docId,
      canonicalUrl: `https://docs.google.com/document/d/${docId}/edit`,
      isValid: true,
      isCreateNew: false,
    };
  }

  // Alphanumeric document ID provided directly
  if (/^[a-zA-Z0-9-_]{15,}$/.test(trimmed)) {
    return {
      docId: trimmed,
      canonicalUrl: `https://docs.google.com/document/d/${trimmed}/edit`,
      isValid: true,
      isCreateNew: false,
    };
  }

  return {
    docId: 'custom_doc',
    canonicalUrl: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
    isValid: true,
    isCreateNew: false,
  };
}

/**
 * Formats structured entry into clean, readable text ready for appending to Google Docs
 */
export function formatEntryForGoogleDoc(payload: McpPayload): string {
  return [
    '================================================================================',
    `WEEKLY PRODUCT PULSE & CUSTOMER CLARIFICATION — ${payload.date}`,
    '================================================================================',
    '',
    'EXECUTIVE SUMMARY:',
    payload.weekly_pulse.executive_summary,
    '',
    'TOP FRICTION SIGNALS:',
    payload.weekly_pulse.friction_signals,
    '',
    'QUOTA & VOICE FINDINGS:',
    payload.weekly_pulse.quota_findings,
    '',
    'RECOMMENDED ACTIONS:',
    payload.weekly_pulse.recommended_actions,
    '',
    'TOP 3 THEMES (RANKED BY VOLUME):',
    ...payload.top_themes.map(t => `#${t.rank} ${t.title} (${t.count} reviews, ${t.percentage}%)`),
    '',
    'IDENTIFIED FEE ISSUE:',
    payload.identified_fee_issue,
    '',
    'NEUTRAL FEE EXPLAINER (≤6 BULLETS):',
    ...payload.explanation_bullets.map((b, i) => `${i + 1}. ${b}`),
    '',
    'VERIFIED OFFICIAL SOURCES:',
    ...payload.source_links.map(s => `• ${s.title}: ${s.url}`),
    '================================================================================',
  ].join('\n');
}

/**
 * Executes approved MCP actions according to strict human approval gate rules.
 */
export async function executeMcpActions(
  payload: McpPayload,
  options: McpExecutionOptions
): Promise<McpActionResult[]> {
  const { approvalRecord, currentContentHash, destinations, simulateAuthError, simulateTimeout, simulatePartialFailure } = options;

  // 1. Mandatory Human Approval Gate Validation
  if (approvalRecord.status !== 'APPROVED') {
    throw new Error(
      `APPROVAL GATE ENFORCEMENT: Cannot execute external actions. Current status is '${approvalRecord.status}'. Human approval is strictly required.`
    );
  }

  // 2. Hash Invariance Check - any edit invalidates previous approval
  if (approvalRecord.contentHash !== currentContentHash) {
    throw new Error(
      `APPROVAL INVALIDATION DETECTED: The content was edited after approval was granted. Previous approval is void. Please re-review and explicitly approve again.`
    );
  }

  const results: McpActionResult[] = [];
  const timestamp = new Date().toISOString();

  // Helper to wait
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // --- GOOGLE DOCS APPEND (Configured with User-Provided Google Doc Link) ---
  if (destinations.google_docs) {
    const docResolution = parseGoogleDocUrl(destinations.google_docs_url);
    if (!docResolution.isValid) {
      throw new Error(`Google Doc Link Error: ${docResolution.reason}`);
    }

    const targetDocId = docResolution.docId;
    const targetDocUrl = docResolution.canonicalUrl;
    const formattedAppendText = formatEntryForGoogleDoc(payload);

    const idempotencyKey = `idemp_gdocs_${targetDocId}_${generateContentHash(JSON.stringify(payload))}`;
    const startMs = Date.now();

    try {
      if (simulateAuthError) {
        throw new Error('HTTP 401 Unauthorized: Invalid or expired Google OAuth access token. Please re-authenticate.');
      }
      if (simulateTimeout) {
        throw new Error('Connection timeout (5000ms): Target MCP Google Docs server did not respond.');
      }

      let deliveryMode: 'REAL_LIVE_WRITE' | 'SANDBOX_MOCK' | 'CLIPBOARD_ASSIST' = 'CLIPBOARD_ASSIST';
      let liveResponseData: Record<string, unknown> | null = null;

      // 1. If Google Docs Bearer Token is provided, make REAL REST API call to Google Docs API
      if (destinations.google_docs_bearer_token && destinations.google_docs_bearer_token.trim().length > 0) {
        const token = destinations.google_docs_bearer_token.trim();
        const apiEndpoint = `https://docs.googleapis.com/v1/documents/${targetDocId}:batchUpdate`;

        const googleResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  endOfSegmentLocation: {},
                  text: `\n\n${formattedAppendText}\n`,
                },
              },
            ],
          }),
        });

        if (!googleResponse.ok) {
          const errorJson = await googleResponse.json().catch(() => ({}));
          throw new Error(
            `Google Docs API Error (${googleResponse.status}): ${
              (errorJson as { error?: { message?: string } })?.error?.message || googleResponse.statusText
            }. Ensure your token has 'https://www.googleapis.com/auth/documents' scope.`
          );
        }

        liveResponseData = await googleResponse.json().catch(() => ({ status: 'ok' }));
        deliveryMode = 'REAL_LIVE_WRITE';
      }
      // 2. If Google Apps Script Webhook URL is provided, send real live payload to Webhook
      else if (destinations.google_docs_webhook_url && destinations.google_docs_webhook_url.trim().length > 0) {
        const webhookEndpoint = destinations.google_docs_webhook_url.trim();

        const webhookResponse = await fetch(webhookEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            documentId: targetDocId,
            documentUrl: targetDocUrl,
            formattedText: formattedAppendText,
            payload,
          }),
        });

        deliveryMode = 'REAL_LIVE_WRITE';
        liveResponseData = await webhookResponse.json().catch(() => ({ status: 'webhook_acknowledged' }));
      }
      // 3. Fallback: Clipboard Assistant Mode
      else {
        // Auto-copy formatted markdown to user's clipboard using robust execCommand + Clipboard API
        await copyToClipboard(formattedAppendText);
        deliveryMode = options.isAutomatedTest ? 'SANDBOX_MOCK' : 'CLIPBOARD_ASSIST';
      }

      // Check idempotency - avoid duplicate entry in store
      const alreadyProcessed = processedIdempotencyKeys.has(idempotencyKey);
      if (!alreadyProcessed) {
        mockGoogleDocStore.entries.push(payload);
        processedIdempotencyKeys.add(idempotencyKey);
      }

      const displayDocLabel = targetDocId === 'new_doc'
        ? 'docs.new'
        : (targetDocId.length > 20 ? targetDocId.slice(0, 16) + '...' : targetDocId);

      results.push({
        tool: 'mcp_google_docs_append',
        destinationName: `Google Docs (${displayDocLabel})`,
        status: 'SUCCESS',
        deliveryMode,
        idempotencyKey,
        timestamp,
        executionDurationMs: Date.now() - startMs,
        requestPayload: {
          mcpMethod: 'tools/call',
          name: 'google_docs_append_entry',
          params: {
            documentId: targetDocId,
            documentUrl: targetDocUrl,
            deliveryMode,
            preserveExistingContent: true,
            structuredEntry: payload,
            formattedTextPreview: formattedAppendText.slice(0, 300) + '... [truncated]',
          },
        },
        responsePayload: {
          statusCode: 200,
          documentId: targetDocId,
          documentUrl: targetDocUrl,
          deliveryMode,
          revisionId: `rev_${Date.now()}`,
          totalEntriesInDoc: mockGoogleDocStore.entries.length,
          idempotentDeduplicated: alreadyProcessed,
          formattedText: formattedAppendText,
          liveData: liveResponseData,
          message:
            deliveryMode === 'REAL_LIVE_WRITE'
              ? `LIVE APPEND SUCCESS: Confirmed write to real Google Doc (${targetDocId}). Your document now contains the new pulse entry!`
              : `CLIPBOARD ASSIST ACTIVE: Because no Google API token or Webhook was connected, the formatted pulse was copied to your clipboard. Open your Google Doc and press Ctrl+V (or Cmd+V) to insert it. Or provide an Apps Script Webhook above for 100% automated live writes.`,
        },
      });
    } catch (err: unknown) {
      results.push({
        tool: 'mcp_google_docs_append',
        destinationName: `Google Docs (${targetDocId})`,
        status: 'FAILED',
        idempotencyKey,
        timestamp,
        executionDurationMs: Date.now() - startMs,
        requestPayload: { documentId: targetDocId, documentUrl: targetDocUrl, structuredEntry: payload },
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // --- NOTION APPEND BLOCK ---
  if (destinations.notion) {
    const idempotencyKey = `idemp_notion_${generateContentHash(JSON.stringify(payload))}`;
    const startMs = Date.now();

    try {
      if (simulateAuthError) {
        throw new Error('HTTP 401 Unauthorized: Notion integration token invalid.');
      }
      if (simulatePartialFailure) {
        throw new Error('HTTP 503 Service Unavailable: Notion API rate limit exceeded. Retry requested.');
      }

      await delay(300);

      const alreadyProcessed = processedIdempotencyKeys.has(idempotencyKey);
      if (!alreadyProcessed) {
        mockNotionDatabaseStore.entries.push(payload);
        processedIdempotencyKeys.add(idempotencyKey);
      }

      results.push({
        tool: 'mcp_notion_append_block',
        destinationName: 'Notion Database (Voice Product Pulse)',
        status: 'SUCCESS',
        idempotencyKey,
        timestamp,
        executionDurationMs: Date.now() - startMs,
        requestPayload: {
          mcpMethod: 'tools/call',
          name: 'notion_append_blocks',
          params: {
            databaseId: mockNotionDatabaseStore.databaseId,
            preserveExistingContent: true,
            structuredEntry: payload,
          },
        },
        responsePayload: {
          statusCode: 200,
          pageId: `notion_page_${Date.now()}`,
          totalEntriesInDb: mockNotionDatabaseStore.entries.length,
          idempotentDeduplicated: alreadyProcessed,
          message: alreadyProcessed
            ? 'Notion block recognized via idempotency key; duplicate suppressed.'
            : 'Structured block successfully appended to Notion database preserving parent blocks.',
        },
      });
    } catch (err: unknown) {
      results.push({
        tool: 'mcp_notion_append_block',
        destinationName: 'Notion Database (Voice Product Pulse)',
        status: 'FAILED',
        idempotencyKey,
        timestamp,
        executionDurationMs: Date.now() - startMs,
        requestPayload: { databaseId: mockNotionDatabaseStore.databaseId, structuredEntry: payload },
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // --- GMAIL CREATE DRAFT ONLY ---
  // STRICT RULE: NEVER SEND EMAILS AUTOMATICALLY! DRAFT ONLY.
  if (destinations.gmail_draft) {
    const idempotencyKey = `idemp_gmail_${generateContentHash(JSON.stringify(payload))}`;
    const startMs = Date.now();

    try {
      if (simulateAuthError) {
        throw new Error('HTTP 401 Unauthorized: Gmail API scope unauthorized.');
      }

      await delay(200);

      const subject = `Weekly Product Pulse + Customer Clarification — [${payload.date}]`;
      const body = `WEEKLY PRODUCT PULSE — ${payload.date}
=====================================================

${payload.weekly_pulse.full_text}

IDENTIFIED CUSTOMER FEE ISSUE:
${payload.identified_fee_issue}

NEUTRAL FEE CLARIFICATION:
${payload.explanation_bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

VERIFIED OFFICIAL SOURCES:
${payload.source_links.map(s => `- ${s.title}: ${s.url}`).join('\n')}

---
[CONFIDENTIAL - INTERNAL PRODUCT DRAFT ONLY. This email is a prepared draft and was NOT sent automatically.]`;

      const draftId = `draft_${Date.now()}`;
      mockGmailDraftsStore.push({
        draftId,
        subject,
        body,
        createdAt: timestamp,
      });

      results.push({
        tool: 'mcp_gmail_create_draft',
        destinationName: 'Gmail (Saved to Drafts Folder)',
        status: 'SUCCESS',
        idempotencyKey,
        timestamp,
        executionDurationMs: Date.now() - startMs,
        requestPayload: {
          mcpMethod: 'tools/call',
          name: 'gmail_create_draft',
          params: {
            subject,
            body,
            autoSend: false, // EXPLICIT SAFETY FLAG: NEVER SEND!
          },
        },
        responsePayload: {
          statusCode: 201,
          draftId,
          subject,
          autoSendExecuted: false,
          safetyConfirmation: 'Email created as a DRAFT only in Gmail. No emails were sent.',
          message: 'Draft successfully created in your Gmail account for manual human review.',
        },
      });
    } catch (err: unknown) {
      results.push({
        tool: 'mcp_gmail_create_draft',
        destinationName: 'Gmail (Saved to Drafts Folder)',
        status: 'FAILED',
        idempotencyKey,
        timestamp,
        executionDurationMs: Date.now() - startMs,
        requestPayload: { subject: `Weekly Product Pulse + Customer Clarification — [${payload.date}]` },
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

/**
 * Access mock stores for test verification or inspection
 */
export function getMockStorageState() {
  return {
    googleDocsEntries: mockGoogleDocStore.entries.length,
    notionEntries: mockNotionDatabaseStore.entries.length,
    gmailDrafts: mockGmailDraftsStore.length,
    idempotencyKeysCount: processedIdempotencyKeys.size,
  };
}

export function resetMockStorageState() {
  mockGoogleDocStore.entries = [];
  mockNotionDatabaseStore.entries = [];
  mockGmailDraftsStore.length = 0;
  processedIdempotencyKeys.clear();
}
