/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReviewRow {
  review_id: string;
  date: string;
  review_text: string;
  rating: number; // 1-5
  platform?: string; // iOS, Android
  user_type?: string; // Plus Subscriber, Free User, Team
  sentiment?: 'positive' | 'neutral' | 'negative';
  cleaned_text?: string;
  is_duplicate?: boolean;
  date_malformed?: boolean;
}

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  detectedColumns: string[];
  columnMappings: {
    review_text: string;
    review_id: string;
    date: string;
    rating: string;
  };
  missingRequiredColumns?: string[];
  duplicateCount: number;
  malformedDateCount: number;
  emptyReviewCount: number;
  sanitizationCount: number;
  warnings: string[];
  errors: string[];
  isValid: boolean;
}

export interface Theme {
  id: string;
  rank: number;
  title: string;
  description: string;
  count: number;
  percentage: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sampleQuotes: Array<{
    quote: string;
    review_id: string;
    rating: number;
    date: string;
    isExactMatch: boolean;
  }>;
}

export interface FeeEvidenceItem {
  review_id: string;
  date: string;
  rating: number;
  user_type?: string;
  verbatim_quote: string;
  fee_claim: string;
  verified_against_raw: boolean;
  risk_category: 'SURPRISE_BILLING' | 'RATE_LIMIT_MISUNDERSTANDING' | 'TIER_CONFUSION' | 'CANCELLATION_ISSUE';
}

export interface OfficialSourceLink {
  title: string;
  url: string;
  domain: string;
  isVerified: boolean;
  verificationNotes: string;
}

export interface NeutralFeeExplainer {
  bullets: string[];
  bulletCount: number;
  maxBullets: number; // 6
  sources: OfficialSourceLink[];
  hasSufficientEvidence: boolean;
  evidenceDisclaimer?: string;
}

export interface WeeklyProductPulse {
  date: string;
  wordCount: number;
  maxWords: number; // 250
  isWithinLimit: boolean;
  executiveSummary: string;
  frictionSignals: string;
  quotaAndVoiceFindings: string;
  recommendedActions: string;
  fullPulseText: string;
}

export type ApprovalStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type TargetMcpDestination = 'google_docs' | 'notion' | 'gmail_draft';

export interface McpDestinationConfig {
  google_docs: boolean;
  notion: boolean;
  gmail_draft: boolean;
  google_docs_url?: string;
  google_docs_id?: string;
  google_docs_webhook_url?: string;
  google_docs_bearer_token?: string;
  google_docs_mode?: 'live_webhook' | 'live_oauth' | 'clipboard_assistant' | 'sandbox_mock';
}

export interface ApprovalRecord {
  status: ApprovalStatus;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  contentHash: string; // Hash of the exact pulse + explainer content
  approvedDestinations: McpDestinationConfig;
  invalidatedNotice?: string;
}

export interface McpActionResult {
  tool: 'mcp_google_docs_append' | 'mcp_notion_append_block' | 'mcp_gmail_create_draft';
  destinationName: string;
  status: 'PENDING' | 'EXECUTING' | 'SUCCESS' | 'FAILED';
  deliveryMode?: 'REAL_LIVE_WRITE' | 'SANDBOX_MOCK' | 'CLIPBOARD_ASSIST';
  idempotencyKey: string;
  timestamp: string;
  requestPayload: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  error?: string;
  executionDurationMs?: number;
}

export interface McpExecutionSummary {
  runId: string;
  startedAt: string;
  completedAt?: string;
  overallStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL_FAILURE' | 'ALL_FAILED';
  results: McpActionResult[];
}

export interface TestAssertion {
  name: string;
  passed: boolean;
  details: string;
  timestamp: string;
}

export interface TestSuiteResult {
  suiteId: string;
  title: string;
  description: string;
  assertions: TestAssertion[];
  passed: boolean;
  elapsedMs: number;
}
