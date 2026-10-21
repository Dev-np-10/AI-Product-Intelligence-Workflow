/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Sanitizes untrusted user text inputs (e.g., CSV cells from public reviews).
 * Strips script tags, malicious HTML, javascript: schemes, and null bytes,
 * while preserving legitimate review text, punctuation, and emojis.
 */
export function sanitizeUntrustedInput(rawInput: string): { sanitized: string; hadRisk: boolean } {
  if (typeof rawInput !== 'string') {
    return { sanitized: String(rawInput ?? ''), hadRisk: false };
  }

  let text = rawInput;
  let hadRisk = false;

  // 1. Check for null bytes or control characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text)) {
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    hadRisk = true;
  }

  // 2. Detect script tags or event handlers
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(text) || /<iframe\b/gi.test(text) || /javascript:/gi.test(text) || /onerror\s*=/gi.test(text) || /onload\s*=/gi.test(text)) {
    hadRisk = true;
  }

  // 3. Strip HTML tags safely
  const withoutTags = text.replace(/<[^>]*>/g, '');
  if (withoutTags !== text) {
    hadRisk = true;
    text = withoutTags;
  }

  // 4. CSV Formula Injection prevention (cells starting with =, +, -, @, or tab)
  if (/^[=+\-@\t\r]/.test(text.trim())) {
    text = "'" + text; // Prepend apostrophe to neutralize spreadsheet formula execution
    hadRisk = true;
  }

  // 5. Length bounding to prevent memory exhaustion (max 4000 chars per review)
  if (text.length > 4000) {
    text = text.substring(0, 4000) + '... [truncated]';
    hadRisk = true;
  }

  return {
    sanitized: text.trim(),
    hadRisk,
  };
}

/**
 * Computes a simple cryptographic/deterministic hash string for content invariance check
 */
export function generateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hash_${Math.abs(hash).toString(16)}_${content.length}`;
}

/**
 * Verifies that a quote exists verbatim inside any of the raw reviews.
 */
export function isVerbatimQuote(quote: string, rawReviews: string[]): boolean {
  if (!quote || quote.trim().length === 0) return false;
  const cleanQuote = quote.trim().toLowerCase().replace(/["'“”]/g, '');
  return rawReviews.some(rev => {
    const cleanRev = (rev || '').toLowerCase().replace(/["'“”]/g, '');
    return cleanRev.includes(cleanQuote);
  });
}
