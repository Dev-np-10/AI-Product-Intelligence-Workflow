/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FeeEvidenceItem, ReviewRow, Theme } from '../types';
import { isVerbatimQuote } from './sanitizer';

interface ThemeDefinition {
  id: string;
  title: string;
  description: string;
  keywords: string[];
}

const THEME_DEFINITIONS: ThemeDefinition[] = [
  {
    id: 'theme_limits_cutoffs',
    title: 'Daily Voice Limits & Abrupt Cutoffs',
    description: 'Frustration around unexpected daily usage caps, lack of a countdown timer, and sudden mid-conversation voice session termination.',
    keywords: ['cutoff', 'cut off', 'limit', 'cap', 'daily', 'resumes at', 'quota', 'sudden', 'countdown', 'timed out', 'abruptly'],
  },
  {
    id: 'theme_fee_subscription',
    title: 'Subscription Pricing & Tier Value Expectations',
    description: 'Customer confusion over $20/month Plus subscription voice entitlements, expectation of unlimited voice access, and tier clarity.',
    keywords: ['$', '20', 'pay', 'paid', 'subscription', 'fee', 'charge', 'charged', 'billed', 'plus', 'tier', 'annual', 'upgrade', 'pricing'],
  },
  {
    id: 'theme_latency_interruptions',
    title: 'Interruption Sensitivity & Voice Latency',
    description: 'Issues with the model interrupting users during natural speech pauses, picking up background noise/TV, or mobile latency delays.',
    keywords: ['interrupt', 'pause', 'background', 'television', 'tv', 'mic', 'microphone', 'latency', 'delay', 'mute'],
  },
  {
    id: 'theme_fidelity_accents',
    title: 'Audio Fidelity, Accents & Multilingual Quality',
    description: 'Praise for realistic voices and smooth language switching, contrasted with recognition difficulty on strong non-native accents.',
    keywords: ['accent', 'scottish', 'fidelity', 'breath', 'natural', 'tutor', 'spanish', 'french', 'bilingual', 'voice option', 'cove'],
  },
];

/**
 * Classifies reviews, computes theme volumes, sentiments, and ranks top 3.
 */
export function extractTopThemes(reviews: ReviewRow[]): Theme[] {
  // Use deduplicated reviews for fair ranking
  const activeReviews = reviews.filter(r => !r.is_duplicate);
  const totalCount = activeReviews.length;
  if (totalCount === 0) return [];

  const rawTexts = reviews.map(r => r.review_text);

  const scoredThemes = THEME_DEFINITIONS.map(def => {
    const matchingReviews = activeReviews.filter(r => {
      const text = (r.cleaned_text || r.review_text).toLowerCase();
      return def.keywords.some(kw => text.includes(kw.toLowerCase()));
    });

    const count = matchingReviews.length;
    const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

    let pos = 0;
    let neu = 0;
    let neg = 0;
    matchingReviews.forEach(r => {
      if (r.sentiment === 'positive') pos++;
      else if (r.sentiment === 'negative') neg++;
      else neu++;
    });

    // Extract exact verbatim customer quotes from matching reviews
    const sampleQuotes = matchingReviews
      .slice(0, 3)
      .map(r => {
        const text = r.review_text.trim();
        return {
          quote: text,
          review_id: r.review_id,
          rating: r.rating,
          date: r.date,
          isExactMatch: isVerbatimQuote(text, rawTexts),
        };
      });

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      count,
      percentage,
      sentimentBreakdown: {
        positive: pos,
        neutral: neu,
        negative: neg,
      },
      sampleQuotes,
    };
  });

  // Sort by count descending, pick top 3
  scoredThemes.sort((a, b) => b.count - a.count);

  return scoredThemes.slice(0, 3).map((theme, idx) => ({
    ...theme,
    rank: idx + 1,
  }));
}

/**
 * Extracts fee-related evidence items with verbatim customer quotes and risk classification.
 */
export function extractFeeEvidence(reviews: ReviewRow[]): {
  items: FeeEvidenceItem[];
  hasSufficientEvidence: boolean;
  unsupportedClaims: string[];
} {
  const feeKeywords = ['$', '20', 'pay', 'paid', 'subscription', 'fee', 'charge', 'charged', 'billed', 'cost', 'annual', 'plus', 'upgrade'];
  const rawTexts = reviews.map(r => r.review_text);

  const matched = reviews.filter(r => {
    const text = (r.cleaned_text || r.review_text).toLowerCase();
    return feeKeywords.some(kw => text.includes(kw));
  });

  const items: FeeEvidenceItem[] = matched.map(r => {
    const text = r.review_text.trim();
    const lower = text.toLowerCase();

    let risk: FeeEvidenceItem['risk_category'] = 'TIER_CONFUSION';
    let claim = 'Customer assumed $20/month Plus subscription included unlimited, uncapped voice minutes.';

    if (lower.includes('cutoff') || lower.includes('cut off') || lower.includes('daily limit') || lower.includes('resume')) {
      risk = 'RATE_LIMIT_MISUNDERSTANDING';
      claim = 'Customer encountered unexpected daily Advanced Voice rate limit cutoff without prior countdown.';
    } else if (lower.includes('charged') || lower.includes('billing breakdown') || lower.includes('annual')) {
      risk = 'SURPRISE_BILLING';
      claim = 'Customer feels billing terms lacked transparent disclosure of voice usage throttling.';
    }

    return {
      review_id: r.review_id,
      date: r.date,
      rating: r.rating,
      user_type: r.user_type,
      verbatim_quote: text,
      fee_claim: claim,
      verified_against_raw: isVerbatimQuote(text, rawTexts),
      risk_category: risk,
    };
  });

  // Requirement check: Insufficient fee evidence
  // We need at least 2 distinct fee-related reviews to substantiate fee findings
  const distinctFeeQuotes = new Set(items.map(i => i.verbatim_quote)).size;
  const hasSufficientEvidence = distinctFeeQuotes >= 2;

  const unsupportedClaims: string[] = [];
  if (!hasSufficientEvidence) {
    unsupportedClaims.push('Dataset contains fewer than 2 verified fee-related reviews. General fee conclusions must not be claimed without sufficient supporting data.');
  }

  return {
    items,
    hasSufficientEvidence,
    unsupportedClaims,
  };
}
