/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataQualityReport, ReviewRow } from '../types';
import { sanitizeUntrustedInput } from './sanitizer';

export const SUGGESTED_COLUMNS = ['review_id', 'date', 'review_text', 'rating'];
export const RECOMMENDED_COLUMNS = ['platform', 'user_type', 'sentiment'];

/**
 * Flexible column index finder that matches exact or partial column names.
 */
function resolveColumnIndex(
  headers: string[],
  candidates: string[],
  fallbackIndex = -1
): { index: number; headerName: string } {
  for (const candidate of candidates) {
    const idx = headers.findIndex(h => h === candidate || h.toLowerCase().replace(/[^a-z0-9]/g, '') === candidate.replace(/[^a-z0-9]/g, ''));
    if (idx !== -1) {
      return { index: idx, headerName: headers[idx] };
    }
  }
  // Try partial containment
  for (const candidate of candidates) {
    const idx = headers.findIndex(h => h.includes(candidate));
    if (idx !== -1) {
      return { index: idx, headerName: headers[idx] };
    }
  }
  if (fallbackIndex >= 0 && fallbackIndex < headers.length) {
    return { index: fallbackIndex, headerName: `${headers[fallbackIndex]} (inferred)` };
  }
  return { index: -1, headerName: 'Auto-generated fallback' };
}

/**
 * Robust CSV parser that handles quotes, escaped commas, newlines inside fields.
 */
export function parseCSV(rawText: string): { headers: string[]; rows: string[][] } {
  const clean = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        // Toggle quote
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentField);
      if (currentRow.some(col => col.trim().length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(col => col.trim().length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1);

  return { headers, rows };
}

/**
 * Validates date string for ISO or YYYY-MM-DD or MM/DD/YYYY format and ensures valid calendar day.
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  if (trimmed.length < 8) return false;

  // Check common date regex patterns
  // YYYY-MM-DD or YYYY/MM/DD or MM/DD/YYYY or ISO 8601
  const parsed = Date.parse(trimmed);
  if (isNaN(parsed)) return false;

  const dateObj = new Date(parsed);
  // Year sanity check (between 2022 and 2030)
  const year = dateObj.getFullYear();
  if (year < 2022 || year > 2030) return false;

  // Check month and day validity
  if (isNaN(dateObj.getDate()) || isNaN(dateObj.getMonth())) return false;

  return true;
}

/**
 * Processes raw CSV text into validated, sanitized ReviewRows with a comprehensive DataQualityReport.
 */
export function processReviewsCSV(csvContent: string): {
  reviews: ReviewRow[];
  report: DataQualityReport;
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!csvContent || csvContent.trim().length === 0) {
    errors.push('The uploaded CSV file is empty. Please provide a dataset with valid reviews.');
    return {
      reviews: [],
      report: {
        totalRows: 0,
        validRows: 0,
        columnMappings: {
          review_text: 'None',
          review_id: 'None',
          date: 'None',
          rating: 'None',
        },
        detectedColumns: [],
        duplicateCount: 0,
        malformedDateCount: 0,
        emptyReviewCount: 0,
        sanitizationCount: 0,
        warnings,
        errors,
        isValid: false,
      },
    };
  }

  const { headers, rows } = parseCSV(csvContent);

  if (rows.length === 0) {
    errors.push('No data rows found in the CSV file (only header present).');
    return {
      reviews: [],
      report: {
        totalRows: 0,
        validRows: 0,
        columnMappings: {
          review_text: 'None',
          review_id: 'None',
          date: 'None',
          rating: 'None',
        },
        detectedColumns: headers,
        duplicateCount: 0,
        malformedDateCount: 0,
        emptyReviewCount: 0,
        sanitizationCount: 0,
        warnings,
        errors,
        isValid: false,
      },
    };
  }

  // Flexible column resolution - NO mandatory column check!
  // Automatically detects standard or alternate headers (content, text, message, feedback, etc.)
  const resolvedText = resolveColumnIndex(
    headers,
    ['review_text', 'review', 'text', 'content', 'comment', 'feedback', 'message', 'body', 'notes', 'summary'],
    headers.length > 2 ? 2 : (headers.length > 1 ? 1 : 0)
  );

  const resolvedId = resolveColumnIndex(
    headers,
    ['review_id', 'id', 'uuid', 'key', 'index', 'number'],
    0
  );

  const resolvedDate = resolveColumnIndex(
    headers,
    ['date', 'timestamp', 'time', 'created_at', 'datetime', 'day'],
    headers.length > 1 && resolvedText.index !== 1 ? 1 : -1
  );

  const resolvedRating = resolveColumnIndex(
    headers,
    ['rating', 'score', 'star', 'stars', 'user_stars', 'rate'],
    headers.length > 3 && resolvedText.index !== 3 ? 3 : -1
  );

  const resolvedPlatform = resolveColumnIndex(headers, ['platform', 'device', 'os', 'channel', 'source'], -1);
  const resolvedUserType = resolveColumnIndex(headers, ['user_type', 'tier', 'plan', 'subscription', 'type'], -1);
  const resolvedSentiment = resolveColumnIndex(headers, ['sentiment', 'sentiment_label', 'polarity'], -1);

  const colIdx = {
    review_id: resolvedId.index,
    date: resolvedDate.index,
    review_text: resolvedText.index,
    rating: resolvedRating.index,
    platform: resolvedPlatform.index,
    user_type: resolvedUserType.index,
    sentiment: resolvedSentiment.index,
  };

  const seenIds = new Set<string>();
  const seenTexts = new Set<string>();
  let duplicateCount = 0;
  let malformedDateCount = 0;
  let emptyReviewCount = 0;
  let sanitizationCount = 0;

  const validReviews: ReviewRow[] = [];

  rows.forEach((row, idx) => {
    const rawId = colIdx.review_id !== -1 && row[colIdx.review_id] ? row[colIdx.review_id]?.trim() : `rev_${idx + 1}`;
    const rawDate = colIdx.date !== -1 && row[colIdx.date] ? row[colIdx.date]?.trim() : '';
    const rawText = colIdx.review_text !== -1 && row[colIdx.review_text] ? row[colIdx.review_text]?.trim() : (row[0] || '').trim();
    const rawRating = colIdx.rating !== -1 && row[colIdx.rating] ? row[colIdx.rating]?.trim() : '3';
    const rawPlatform = colIdx.platform !== -1 && row[colIdx.platform] ? row[colIdx.platform]?.trim() : 'Mobile';
    const rawUserType = colIdx.user_type !== -1 && row[colIdx.user_type] ? row[colIdx.user_type]?.trim() : 'User';
    const rawSentiment = colIdx.sentiment !== -1 && row[colIdx.sentiment] ? row[colIdx.sentiment]?.trim().toLowerCase() : undefined;

    // Check empty review text
    if (!rawText || rawText.length === 0) {
      emptyReviewCount++;
      return; // Skip empty review text
    }

    // Sanitization check
    const sanitizedId = sanitizeUntrustedInput(rawId || `rev_${idx + 1}`);
    const sanitizedText = sanitizeUntrustedInput(rawText);
    if (sanitizedId.hadRisk || sanitizedText.hadRisk) {
      sanitizationCount++;
    }

    // Duplicate detection
    const normalizedText = sanitizedText.sanitized.toLowerCase().replace(/\s+/g, ' ');
    const isDupId = seenIds.has(sanitizedId.sanitized);
    const isDupText = seenTexts.has(normalizedText);

    let isDuplicate = false;
    if (isDupId || isDupText) {
      duplicateCount++;
      isDuplicate = true;
    } else {
      seenIds.add(sanitizedId.sanitized);
      seenTexts.add(normalizedText);
    }

    // Date validation
    const hasDate = Boolean(rawDate && rawDate.length > 0);
    const dateValid = hasDate ? isValidDateString(rawDate) : true;
    if (hasDate && !dateValid) {
      malformedDateCount++;
    }

    // Rating validation
    let numericRating = parseFloat(rawRating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      numericRating = 3;
    }

    // Sentiment normalization
    let normSentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (rawSentiment === 'positive' || numericRating >= 4) {
      normSentiment = 'positive';
    } else if (rawSentiment === 'negative' || numericRating <= 2) {
      normSentiment = 'negative';
    }

    validReviews.push({
      review_id: sanitizedId.sanitized,
      date: dateValid && hasDate ? rawDate : '2026-10-21',
      review_text: rawText,
      cleaned_text: sanitizedText.sanitized,
      rating: numericRating,
      platform: rawPlatform,
      user_type: rawUserType,
      sentiment: normSentiment,
      is_duplicate: isDuplicate,
      date_malformed: Boolean(hasDate && !dateValid),
    });
  });

  if (duplicateCount > 0) {
    warnings.push(`Detected ${duplicateCount} duplicate review(s). De-duplication applied to ranking and quote selections.`);
  }

  if (malformedDateCount > 0) {
    warnings.push(`Detected ${malformedDateCount} malformed or invalid date timestamp(s). Standardized for analysis.`);
  }

  if (emptyReviewCount > 0) {
    warnings.push(`Skipped ${emptyReviewCount} empty review row(s).`);
  }

  if (sanitizationCount > 0) {
    warnings.push(`Sanitized untrusted inputs in ${sanitizationCount} record(s) (neutralized potential HTML/CSV formulas/scripts).`);
  }

  const isValid = errors.length === 0 && validReviews.length > 0;

  return {
    reviews: validReviews,
    report: {
      totalRows: rows.length,
      validRows: validReviews.length,
      columnMappings: {
        review_text: resolvedText.headerName,
        review_id: resolvedId.headerName,
        date: resolvedDate.headerName,
        rating: resolvedRating.headerName,
      },
      detectedColumns: headers,
      duplicateCount,
      malformedDateCount,
      emptyReviewCount,
      sanitizationCount,
      warnings,
      errors,
      isValid,
    },
  };
}
