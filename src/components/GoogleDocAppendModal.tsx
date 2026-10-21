/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Copy,
  ExternalLink,
  Download,
  CheckCircle2,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { copyToClipboard, downloadGoogleDocFile } from '../utils/clipboardHelper';

interface GoogleDocAppendModalProps {
  isOpen: boolean;
  onClose: () => void;
  formattedText: string;
  targetDocUrl?: string;
  date: string;
}

export const GoogleDocAppendModal: React.FC<GoogleDocAppendModalProps> = ({
  isOpen,
  onClose,
  formattedText,
  targetDocUrl,
  date,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(formattedText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    downloadGoogleDocFile('Weekly Product Pulse', formattedText, date);
  };

  const docUrl = targetDocUrl && targetDocUrl.length > 0 ? targetDocUrl : 'https://docs.new';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Append to Google Doc</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready to Sync
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Insert your approved Product Pulse into your real Google Doc in 2 simple steps.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Why this step explanation */}
        <div className="bg-slate-950/80 p-3.5 border-b border-slate-800 text-xs text-slate-300 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-white">Why manual paste? </span>
            Google&apos;s security strictly prevents external websites from silently writing to private Google Docs without an active Google OAuth permission or Webhook. Use the 2 steps below to paste the approved content in 2 seconds.
          </div>
        </div>

        {/* 2-Step Action Ribbon */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Step 1: Copy */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-white">Copy Formatted Pulse</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5 leading-tight">
                Copies all formatted sections, themes, verbatim quotes, and sources.
              </p>
            </div>
            <button
              onClick={handleCopy}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Click to Copy All Content</span>
                </>
              )}
            </button>
          </div>

          {/* Step 2: Open and Paste */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold text-white">Open Doc &amp; Press Ctrl+V</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5 leading-tight">
                Opens your Google Doc in a new tab; simply press <strong>Ctrl+V</strong> (or <strong>Cmd+V</strong>).
              </p>
            </div>
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span>Open Google Doc</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Formatted Document Content Preview:</span>
            <button
              onClick={handleDownload}
              className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Or Download as .doc File</span>
            </button>
          </div>

          <pre className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60">
            {formattedText}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {copied ? '✓ Ready to paste in your Google Doc!' : 'Click Step 1 to copy, then Step 2 to open your doc.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
