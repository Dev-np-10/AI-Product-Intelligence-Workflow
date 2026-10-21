/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, AlertTriangle, Check, Sparkles, HelpCircle, Clock } from 'lucide-react';
import { NeutralFeeExplainer, WeeklyProductPulse } from '../types';
import { countWords } from '../utils/pulseGenerator';

interface EditPulseModalProps {
  isOpen: boolean;
  onClose: () => void;
  pulse: WeeklyProductPulse;
  explainer: NeutralFeeExplainer;
  onSave: (updatedPulse: WeeklyProductPulse, updatedExplainer: NeutralFeeExplainer) => void;
}

export const EditPulseModal: React.FC<EditPulseModalProps> = ({
  isOpen,
  onClose,
  pulse,
  explainer,
  onSave,
}) => {
  if (!isOpen) return null;

  const [executiveSummary, setExecutiveSummary] = useState(pulse.executiveSummary);
  const [frictionSignals, setFrictionSignals] = useState(pulse.frictionSignals);
  const [quotaFindings, setQuotaFindings] = useState(pulse.quotaAndVoiceFindings);
  const [recommendedActions, setRecommendedActions] = useState(pulse.recommendedActions);
  const [bulletsText, setBulletsText] = useState(explainer.bullets.join('\n'));

  // Calculate live word count
  const fullText = `${executiveSummary}\n\n${frictionSignals}\n\n${quotaFindings}\n\n${recommendedActions}`.trim();
  const liveWordCount = countWords(fullText);
  const isWordCountValid = liveWordCount <= 250;

  // Calculate live bullets
  const parsedBullets = bulletsText.split('\n').map(b => b.trim()).filter(b => b.length > 0);
  const liveBulletCount = parsedBullets.length;
  const isBulletCountValid = liveBulletCount <= 6;

  const handleSave = () => {
    const updatedPulse: WeeklyProductPulse = {
      ...pulse,
      executiveSummary,
      frictionSignals,
      quotaAndVoiceFindings: quotaFindings,
      recommendedActions,
      fullPulseText: fullText,
      wordCount: liveWordCount,
      isWithinLimit: isWordCountValid,
    };

    const updatedExplainer: NeutralFeeExplainer = {
      ...explainer,
      bullets: parsedBullets,
      bulletCount: liveBulletCount,
    };

    onSave(updatedPulse, updatedExplainer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Edit Weekly Pulse &amp; Neutral Fee Explainer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invalidation Alert */}
        <div className="bg-amber-950/50 border-b border-amber-800/80 p-3.5 flex items-start space-x-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <span className="font-semibold text-amber-100">Approval Invalidation Rule: </span>
            Saving any modifications will alter the cryptographic content hash and automatically invalidate previous approvals. You will need to explicitly re-approve before MCP actions can dispatch.
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Word Count Indicator */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="font-medium text-slate-300">Pulse Word Count Constraint (≤250 words):</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-xs ${
                isWordCountValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {liveWordCount} / 250 words {isWordCountValid ? '✓' : '(EXCEEDED)'}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Executive Summary
            </label>
            <textarea
              rows={2}
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Top Friction Signals
            </label>
            <textarea
              rows={2}
              value={frictionSignals}
              onChange={(e) => setFrictionSignals(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Quota &amp; Voice Latency Findings
            </label>
            <textarea
              rows={2}
              value={quotaFindings}
              onChange={(e) => setQuotaFindings(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Recommended Product Actions
            </label>
            <textarea
              rows={2}
              value={recommendedActions}
              onChange={(e) => setRecommendedActions(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Fee Explainer Bullets Editor */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300">
                Neutral Fee Explainer Bullets (one per line, ≤6 bullets)
              </label>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${
                  isBulletCountValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {liveBulletCount} / 6 bullets {isBulletCountValid ? '✓' : '(EXCEEDED)'}
              </span>
            </div>
            <textarea
              rows={5}
              value={bulletsText}
              onChange={(e) => setBulletsText(e.target.value)}
              placeholder="Enter bullet points (one per line)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {(!isWordCountValid || !isBulletCountValid) ? (
              <span className="text-rose-400">Fix limit violations before saving.</span>
            ) : (
              'All constraints satisfied.'
            )}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isWordCountValid || !isBulletCountValid}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Changes &amp; Invalidate Approval</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
