/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  Quote,
  ShieldCheck,
  DollarSign,
  AlertOctagon,
  Star,
  CheckCircle,
} from 'lucide-react';
import { FeeEvidenceItem, Theme } from '../types';

interface ThemesAndEvidenceViewProps {
  topThemes: Theme[];
  feeEvidence: {
    items: FeeEvidenceItem[];
    hasSufficientEvidence: boolean;
    unsupportedClaims: string[];
  };
}

export const ThemesAndEvidenceView: React.FC<ThemesAndEvidenceViewProps> = ({
  topThemes,
  feeEvidence,
}) => {
  return (
    <div className="space-y-6">
      {/* Top 3 Themes Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Top 3 ChatGPT Mobile Voice Themes</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked strictly by customer review volume and sentiment impact with 100% verbatim customer quotes.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            Deduplicated Volume Ranking
          </span>
        </div>

        {topThemes.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No themes available. Upload a valid reviews CSV above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            {topThemes.map((theme) => (
              <div
                key={theme.id}
                className="bg-slate-50/60 border border-slate-200 hover:border-blue-300 rounded-xl p-4.5 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
                      #{theme.rank}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      {theme.count} reviews ({theme.percentage}%)
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">{theme.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {theme.description}
                  </p>

                  {/* Sentiment Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-medium">Sentiment</span>
                      <span>
                        <span className="text-emerald-700 font-semibold">{theme.sentimentBreakdown.positive} pos</span> /{' '}
                        <span className="text-slate-500">{theme.sentimentBreakdown.neutral} neu</span> /{' '}
                        <span className="text-rose-600 font-semibold">{theme.sentimentBreakdown.negative} neg</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full flex overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${theme.count ? (theme.sentimentBreakdown.positive / theme.count) * 100 : 0}%`,
                        }}
                      />
                      <div
                        className="bg-slate-400 h-full"
                        style={{
                          width: `${theme.count ? (theme.sentimentBreakdown.neutral / theme.count) * 100 : 0}%`,
                        }}
                      />
                      <div
                        className="bg-rose-500 h-full"
                        style={{
                          width: `${theme.count ? (theme.sentimentBreakdown.negative / theme.count) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Exact Customer Quotes */}
                <div>
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1">
                    <Quote className="w-3 h-3 text-blue-600" />
                    <span>Exact Verbatim Quotes</span>
                  </div>
                  <div className="space-y-2">
                    {theme.sampleQuotes.map((q, qIdx) => (
                      <div
                        key={`q_${qIdx}`}
                        className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 shadow-2xs"
                      >
                        <p className="italic text-slate-700 mb-2 leading-relaxed">
                          &ldquo;{q.quote}&rdquo;
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                          <span className="font-mono text-slate-600">{q.review_id} • {q.date}</span>
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-medium">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>100% Verbatim</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fee-Related Evidence Dossier */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Fee &amp; Subscription Voice Evidence</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identified friction points regarding $20/month Plus pricing, daily quota cutoffs, and tier expectations.
            </p>
          </div>

          <div>
            {feeEvidence.hasSufficientEvidence ? (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sufficient Evidence ({feeEvidence.items.length} verified reviews)</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Insufficient Evidence Guardrail Triggered</span>
              </span>
            )}
          </div>
        </div>

        {/* Insufficient Evidence Guardrail Alert */}
        {!feeEvidence.hasSufficientEvidence && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900">
            <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-amber-900 mb-0.5">
                Insufficient Fee Evidence Guardrail Active
              </div>
              <p className="leading-relaxed text-amber-800">
                {feeEvidence.unsupportedClaims[0] ||
                  'The uploaded dataset has fewer than 2 verified fee-related reviews. Generalized pricing or billing claims are automatically blocked to prevent unsupported conclusions.'}
              </p>
            </div>
          </div>
        )}

        {/* Fee Evidence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
          {feeEvidence.items.length === 0 ? (
            <div className="col-span-2 py-6 text-center text-xs text-slate-400">
              No fee-related reviews detected in this dataset.
            </div>
          ) : (
            feeEvidence.items.map((item, idx) => (
              <div
                key={`fee_${idx}`}
                className="bg-slate-50/70 border border-slate-200 hover:border-amber-300 rounded-xl p-4 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                      {item.risk_category.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center space-x-1 text-amber-600 text-xs">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span className="font-bold">{item.rating}/5</span>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-slate-800 italic mb-2 leading-relaxed">
                    &ldquo;{item.verbatim_quote}&rdquo;
                  </p>

                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 mb-2 shadow-2xs">
                    <span className="font-bold text-slate-900">Identified Issue: </span>
                    {item.fee_claim}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                  <span>ID: <code className="text-slate-800 font-mono font-medium">{item.review_id}</code> ({item.user_type || 'User'})</span>
                  <span className="text-emerald-700 font-medium flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Raw Verified</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
