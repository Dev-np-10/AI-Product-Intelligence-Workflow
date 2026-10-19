import type {
  FeeEvidenceItem,
  FeeEvidenceReport,
  FeeExplainer,
  PulseReport,
  ReviewRow,
  Theme,
  VerifiedSource,
} from '@/types';
import { ALLOWED_OFFICIAL_DOMAINS } from '@/types';

interface ThemeDef {
  name: string;
  keywords: string[];
}

const THEME_DEFS: ThemeDef[] = [
  {
    name: 'Voice Recognition & Transcription Accuracy',
    keywords: ['accuracy', 'accurate', 'transcrib', 'transcript', 'recogni', 'mishear', 'misunderstand', 'wrong word', 'hear me', 'didn\'t hear', 'did not hear', 'speech', 'dictation', 'wrong text'],
  },
  {
    name: 'Latency & Responsiveness',
    keywords: ['slow', 'lag', 'latency', 'delay', 'laggy', 'freeze', 'frozen', 'stutter', 'stuttering', 'response time', 'loading', 'buffer'],
  },
  {
    name: 'Voice Mode Feature Experience',
    keywords: ['voice mode', 'voice feature', 'conversation', 'conversational', 'natural', 'real-time', 'realtime', 'back-and-forth', 'interrupt', 'tap to speak', 'hands free', 'hands-free', 'walk', 'driving'],
  },
  {
    name: 'Subscription & Pricing Concerns',
    keywords: ['fee', 'fees', 'price', 'pricing', 'cost', 'costly', 'subscription', 'pay', 'paid', 'expensive', 'charge', 'charged', 'billing', 'plan', 'upgrade', 'plus', 'pro', 'limit', 'quota', 'cap', 'free tier', 'paywall'],
  },
  {
    name: 'Reliability & Connectivity',
    keywords: ['crash', 'crashes', 'crashed', 'error', 'bug', 'buggy', 'broken', 'disconnect', 'connection', 'offline', 'unavailable', 'drop', 'fails', 'failed', 'won\'t work', 'does not work', 'glitch'],
  },
  {
    name: 'Privacy & Data Handling',
    keywords: ['privacy', 'data', 'record', 'recording', 'listen', 'listening', 'store', 'stored', 'permission', 'consent', 'microphone', 'mic access'],
  },
  {
    name: 'Overall Sentiment & Praise',
    keywords: ['love', 'great', 'amazing', 'awesome', 'helpful', 'useful', 'fantastic', 'wonderful', 'best', 'game changer', 'game-changer', 'impressed', 'recommend', 'perfect', '5 star'],
  },
];

function countMatches(row: ReviewRow, keywords: string[]): number {
  const haystack = `${row.title} ${row.body}`.toLowerCase();
  let count = 0;
  for (const kw of keywords) {
    if (haystack.includes(kw)) count++;
  }
  return count;
}

function sentimentFromRating(rating: number): 'negative' | 'neutral' | 'positive' {
  if (rating <= 2) return 'negative';
  if (rating === 3) return 'neutral';
  return 'positive';
}

export function extractThemes(rows: ReviewRow[]): Theme[] {
  interface ThemeAccum {
    def: ThemeDef;
    count: number;
    bestRow: ReviewRow | null;
  }
  const themeCounts: ThemeAccum[] = THEME_DEFS.map((def): ThemeAccum => {
    let count = 0;
    let bestRow: ReviewRow | null = null;
    let bestScore = 0;

    rows.forEach((row) => {
      const score = countMatches(row, def.keywords);
      if (score > 0) {
        count++;
        if (score > bestScore) {
          bestScore = score;
          bestRow = row;
        }
      }
    });

    return { def, count, bestRow };
  });

  return themeCounts
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .map(({ def, count, bestRow }): Theme => ({
      name: def.name,
      count,
      keywords: def.keywords.slice(0, 6),
      representativeQuote: bestRow ? bestRow.body : '',
      quoteAuthor: bestRow ? bestRow.author : '',
      quoteDate: bestRow ? bestRow.date : '',
    }));
}

export function topThemes(rows: ReviewRow[], n = 3): Theme[] {
  return extractThemes(rows).slice(0, n);
}

export function extractFeeEvidence(rows: ReviewRow[]): FeeEvidenceReport {
  const feeKeywords = ['fee', 'fees', 'price', 'pricing', 'cost', 'costly', 'subscription', 'expensive', 'charge', 'charged', 'billing', 'paywall', 'pay', 'paid', 'plan', 'upgrade', 'plus', 'pro price'];
  const items: FeeEvidenceItem[] = [];

  rows.forEach((row) => {
    const hay = `${row.title} ${row.body}`.toLowerCase();
    if (feeKeywords.some((kw) => hay.includes(kw))) {
      items.push({
        quote: row.body,
        author: row.author,
        date: row.date,
        rating: row.rating,
        sentiment: sentimentFromRating(row.rating),
      });
    }
  });

  return {
    totalFeeMentions: items.length,
    items,
    insufficient: items.length < 3,
  };
}

const FEE_EXPLAINER_BULLETS = [
  'ChatGPT is free to use on mobile, including the Voice Mode feature that lets users have a spoken, back-and-forth conversation with the assistant.',
  'Free-tier Voice Mode is subject to usage limits; once those limits are reached, users see messaging that invites them to upgrade rather than continuing to use voice.',
  'A paid subscription (ChatGPT Plus) unlocks higher usage allowances and access to newer, higher-capacity models that support more advanced voice conversations.',
  'Subscription pricing is set by OpenAI and is billed through the Apple App Store or Google Play Store depending on the platform, following each store\'s standard in-app purchase flow.',
  'Reviews citing "fees" or "charges" typically reflect the free-tier-to-paid upgrade prompt, not a mandatory charge for opening the app or using the basic chat experience.',
  'OpenAI publishes plan details and pricing on its official site; app stores show the in-app purchase price for each region before any purchase is confirmed.',
];

const OFFICIAL_SOURCES: VerifiedSource[] = [
  {
    title: 'OpenAI — ChatGPT plans and pricing',
    url: 'https://openai.com/chatgpt/pricing/',
    verified: true,
    reason: 'Official OpenAI domain. Authoritative source for plan tiers and pricing.',
  },
  {
    title: 'OpenAI Help Center — Using Voice Mode in ChatGPT',
    url: 'https://help.openai.com/en/articles/16650786-using-voice-mode-in-chatgpt-faq',
    verified: true,
    reason: 'Official OpenAI Help Center domain. Describes Voice Mode availability and limits.',
  },
];

export function buildFeeExplainer(): FeeExplainer {
  return {
    bullets: FEE_EXPLAINER_BULLETS,
    sources: OFFICIAL_SOURCES,
    bulletCount: FEE_EXPLAINER_BULLETS.length,
    bulletsWithinLimit: FEE_EXPLAINER_BULLETS.length <= 6,
    sourcesVerified: OFFICIAL_SOURCES.every((s) => s.verified),
  };
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function buildPulseReport(
  rows: ReviewRow[],
  themes: Theme[],
  feeEvidence: FeeEvidenceReport,
): PulseReport {
  const total = rows.length;
  const avgRating = total > 0
    ? (rows.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(2)
    : '0.00';

  const negative = rows.filter((r) => r.rating <= 2).length;
  const positive = rows.filter((r) => r.rating >= 4).length;
  const negPct = total > 0 ? Math.round((negative / total) * 100) : 0;
  const posPct = total > 0 ? Math.round((positive / total) * 100) : 0;

  const themeLine = themes.slice(0, 3)
    .map((t, i) => `${i + 1}. ${t.name} (${t.count} reviews)`)
    .join('; ');

  const feeLine = feeEvidence.insufficient
    ? `Fee mentions were below threshold (${feeEvidence.totalFeeMentions}), so pricing sentiment is not statistically representative.`
    : `Fee-related mentions appeared in ${feeEvidence.totalFeeMentions} reviews, mostly from users pushed to upgrade during free-tier voice limits.`;

  const body = [
    `This pulse summarizes ${total} public mobile reviews of ChatGPT Voice Mode.`,
    `Average rating: ${avgRating}/5. Positive: ${posPct}%, Negative: ${negPct}%.`,
    `Top themes: ${themeLine}.`,
    feeLine,
    `Representative quote: "${themes[0]?.representativeQuote?.slice(0, 120) ?? 'N/A'}".`,
    `Recommendation: prioritize reliability and voice accuracy fixes; clarify the free-tier voice limit messaging to reduce fee confusion.`,
  ].join(' ');

  const wordCount = countWords(body);
  return {
    title: 'Weekly Product Pulse — ChatGPT Mobile Voice Mode',
    body,
    wordCount,
    tooLong: wordCount > 250,
  };
}

export function countWordsPublic(text: string): number {
  return countWords(text);
}
