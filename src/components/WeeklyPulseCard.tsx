/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileText,
  ExternalLink,
  ShieldCheck,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ApprovalStatus, NeutralFeeExplainer, WeeklyProductPulse } from '../types';

interface WeeklyPulseCardProps {
  pulse: WeeklyProductPulse;
  explainer: NeutralFeeExplainer;
  approvalStatus: ApprovalStatus;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  approvalInvalidatedNotice?: string;
}

export const WeeklyPulseCard: React.FC<WeeklyPulseCardProps> = ({
  pulse,
  explainer,
  approvalStatus,
  onApprove,
  onReject,
  onEdit,
  approvalInvalidatedNotice,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-slate-900">
      {/* Invalidation Alert if edits occurred */}
      {approvalInvalidatedNotice && (
        <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900">Notice: </span>
            {approvalInvalidatedNotice}
          </div>
        </div>
      )}

      {/* Header with Word and Bullet Count Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Generated Weekly Product Pulse &amp; Fee Explainer</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict constraint review: Weekly Product Pulse (≤250 words) and Neutral Fee Explainer (≤6 bullets, 2 verified official sources).
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Word Count Badge */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              pulse.isWithinLimit
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {pulse.wordCount} / {pulse.maxWords} words {pulse.isWithinLimit ? '(Valid)' : '(Exceeded!)'}
            </span>
          </div>

          {/* Bullet Count Badge */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              explainer.bulletCount <= explainer.maxBullets
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <span>
              {explainer.bulletCount} / {explainer.maxBullets} bullets max
            </span>
          </div>

          {/* Sources Badge */}
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>2 Verified Sources</span>
          </div>
        </div>
      </div>

      {/* Main Pulse & Explainer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-5">
        {/* Left Column: Weekly Product Pulse */}
        <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Weekly Product Pulse ({pulse.date})</span>
            </span>
            <span className="text-xs font-medium text-slate-500">{pulse.wordCount} words</span>
          </div>

          <div className="space-y-3.5 text-xs text-slate-800 leading-relaxed">
            <div>
              <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">
                Executive Summary
              </div>
              <p className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700 shadow-2xs">
                {pulse.executiveSummary}
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                Top Friction Signals
              </div>
              <p className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700 shadow-2xs">
                {pulse.frictionSignals}
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">
                Quota &amp; Voice Latency Findings
              </div>
              <p className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700 shadow-2xs">
                {pulse.quotaAndVoiceFindings}
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                Recommended Product Actions
              </div>
              <p className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700 shadow-2xs">
                {pulse.recommendedActions}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Neutral Fee Explainer & Verified Official Sources */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Neutral Fee Explainer (≤ 6 Bullets)</span>
              </span>
              <span className="text-xs font-medium text-slate-500">{explainer.bulletCount} bullets</span>
            </div>

            {explainer.evidenceDisclaimer && (
              <div className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mb-3">
                {explainer.evidenceDisclaimer}
              </div>
            )}

            <ul className="space-y-2.5 text-xs text-slate-700">
              {explainer.bullets.map((bullet, idx) => (
                <li key={`b_${idx}`} className="flex items-start space-x-2.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Official Sources Section */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Official OpenAI Sources (2 Links)</span>
            </div>
            <div className="space-y-2">
              {explainer.sources.map((src, idx) => (
                <a
                  key={`src_${idx}`}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-blue-700 group-hover:text-blue-800">
                      {src.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                    <span className="font-mono text-emerald-700 font-semibold">{src.domain}</span>
                    <span>•</span>
                    <span className="text-slate-500 truncate">{src.verificationNotes}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Human Review Toolbar: Approve, Reject, Edit */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Human Approval Rule: </span>
          Approval is bound to content hash. Any text edit immediately invalidates prior approval.
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Edit Content</span>
          </button>

          {/* Reject Button */}
          <button
            onClick={onReject}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer ${
              approvalStatus === 'REJECTED'
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>{approvalStatus === 'REJECTED' ? 'Rejected' : 'Reject'}</span>
          </button>

          {/* Approve Button */}
          <button
            onClick={onApprove}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer ${
              approvalStatus === 'APPROVED'
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{approvalStatus === 'APPROVED' ? 'Approved (Ready to Dispatch)' : 'Approve Content'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
