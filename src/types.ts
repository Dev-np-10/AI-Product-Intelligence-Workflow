export interface ReviewRow {
  id: string;
  author: string;
  date: string;        // ISO YYYY-MM-DD when parseable
  rawDate: string;     // original value
  rating: number;      // 1-5
  title: string;
  body: string;
  source: string;
}

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  malformedDates: number;
  missingRequired: number;
  invalidRatings: number;
  ratingBreakdown: Record<number, number>;
  dateRange: { earliest: string | null; latest: string | null };
  issues: DataQualityIssue[];
}

export interface DataQualityIssue {
  row: number;
  type: 'missing_column' | 'missing_required' | 'malformed_date' | 'invalid_rating' | 'duplicate';
  message: string;
}

export interface Theme {
  name: string;
  count: number;
  keywords: string[];
  representativeQuote: string;
  quoteAuthor: string;
  quoteDate: string;
}

export interface FeeEvidenceItem {
  quote: string;
  author: string;
  date: string;
  rating: number;
  sentiment: 'negative' | 'neutral' | 'positive';
}

export interface FeeEvidenceReport {
  totalFeeMentions: number;
  items: FeeEvidenceItem[];
  insufficient: boolean;
}

export interface PulseReport {
  title: string;
  body: string;
  wordCount: number;
  tooLong: boolean;
}

export interface FeeExplainer {
  bullets: string[];
  sources: VerifiedSource[];
  bulletCount: number;
  bulletsWithinLimit: boolean;
  sourcesVerified: boolean;
}

export interface VerifiedSource {
  title: string;
  url: string;
  verified: boolean;
  reason: string;
}

export type McpActionType = 'google-docs' | 'notion' | 'email-draft';

export interface McpAction {
  id: string;
  type: McpActionType;
  title: string;
  summary: string;
  payload: unknown;
}

export interface McpResult {
  actionId: string;
  success: boolean;
  message: string;
  mockRef?: string;
}

export interface ValidationResult {
  name: string;
  passed: boolean;
  detail: string;
}

export interface ValidationReport {
  totalTests: number;
  passed: number;
  failed: number;
  results: ValidationResult[];
}

export interface CsvParseResult {
  rows: ReviewRow[];
  errors: DataQualityIssue[];
  missingRequiredColumns: string[];
}

export const REQUIRED_COLUMNS = ['author', 'date', 'rating', 'title', 'body', 'source'] as const;
export type RequiredColumn = typeof REQUIRED_COLUMNS[number];

export const ALLOWED_OFFICIAL_DOMAINS = [
  'openai.com',
  'help.openai.com',
  'platform.openai.com',
  'chatgpt.com',
  'apple.com',
  'apps.apple.com',
  'support.apple.com',
  'google.com',
  'play.google.com',
] as const;
