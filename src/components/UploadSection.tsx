/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Database,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  HEALTHY_VOICE_REVIEWS_CSV,
  MALFORMED_DIRTY_REVIEWS_CSV,
  MISSING_COLUMNS_CSV,
  INSUFFICIENT_FEE_EVIDENCE_CSV,
  EMPTY_CSV,
} from '../utils/sampleData';

interface UploadSectionProps {
  onLoadCSV: (content: string, name: string) => void;
  activeDatasetName: string;
  reviewsCount?: number;
  onAnalyzeAndProceed?: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onLoadCSV,
  activeDatasetName,
  reviewsCount = 0,
  onAnalyzeAndProceed,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteZone, setShowPasteZone] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      readFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onLoadCSV(content, file.name);
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pastedContent.trim()) return;
    onLoadCSV(pastedContent.trim(), 'Custom Pasted CSV');
    setShowPasteZone(false);
  };

  const presets = [
    {
      id: 'healthy',
      name: 'Genuine Reviews (Healthy)',
      desc: '15 authentic ChatGPT mobile voice reviews (Plus subscriptions, voice latency, quota cutoffs)',
      badge: 'Recommended',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      action: () => onLoadCSV(HEALTHY_VOICE_REVIEWS_CSV, 'Genuine Reviews (Healthy)'),
    },
    {
      id: 'dirty',
      name: 'Malformed & Dirty Dataset',
      desc: 'Tests sanitization: duplicate rows, invalid date stamps, formula injection & script tags',
      badge: 'Hygiene Audit',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      action: () => onLoadCSV(MALFORMED_DIRTY_REVIEWS_CSV, 'Malformed & Dirty Dataset'),
    },
    {
      id: 'insufficient_fee',
      name: 'Insufficient Fee Evidence',
      desc: 'Tests governance guardrail when reviews lack billing evidence (<2 reviews substantiated)',
      badge: 'Guardrail Test',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      action: () => onLoadCSV(INSUFFICIENT_FEE_EVIDENCE_CSV, 'Insufficient Fee Evidence'),
    },
    {
      id: 'missing_cols',
      name: 'Alternate Column Headers',
      desc: 'Demonstrates flexible schema mapping (maps content -> review_text and user_stars -> rating)',
      badge: 'Flexible Schema',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      action: () => onLoadCSV(MISSING_COLUMNS_CSV, 'Alternate Column Headers'),
    },
    {
      id: 'empty',
      name: 'Empty CSV Edge Case',
      desc: '0-byte file to verify resilient error trapping and empty state messaging',
      badge: 'Edge Case',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      action: () => onLoadCSV(EMPTY_CSV, 'Empty CSV Edge Case'),
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Main Upload Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Upload CSV File
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Select or drop a CSV file containing ChatGPT mobile voice reviews to ingest, sanitize, and analyze.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Input Sanitization Guard Active</span>
            </span>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div className="mt-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-600 bg-blue-50/80 ring-4 ring-blue-500/10'
                : 'border-blue-200 hover:border-blue-400 bg-blue-50/20 hover:bg-blue-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center shadow-xs">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">
                  Drag &amp; drop your review CSV file here, or{' '}
                  <span className="text-blue-600 hover:underline">browse your computer</span>
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                  Accepts standard CSV files with review text, date, rating, and user tier. Automatically maps custom or alternate column headers.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-white text-slate-600 border border-slate-200 shadow-xs">
                  Supported format: .csv
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-white text-slate-600 border border-slate-200 shadow-xs">
                  Max size: 10MB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button & Active File Status */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0" />
            <div>
              <span className="text-slate-500">Currently Loaded: </span>
              <span className="font-semibold text-slate-800">{activeDatasetName}</span>
              {reviewsCount > 0 && (
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {reviewsCount} reviews parsed
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowPasteZone(!showPasteZone)}
              className="text-xs font-medium text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-200 bg-white shadow-xs transition-colors cursor-pointer"
            >
              {showPasteZone ? 'Hide Paste Box' : 'Paste Raw CSV'}
            </button>

            {onAnalyzeAndProceed && (
              <button
                type="button"
                onClick={onAnalyzeAndProceed}
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer w-full sm:w-auto"
              >
                <span>Analyze &amp; View Pulse</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Raw CSV Paste Box */}
        {showPasteZone && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Paste Raw CSV Text Directly:
              </span>
              <span className="text-xs text-slate-500">Include header row (e.g. review_id, review_text, date, rating)</span>
            </div>
            <textarea
              rows={4}
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              placeholder="review_id,date,rating,review_text,source,user_tier&#10;1,2026-10-18,2,The new voice mode stops after 10 minutes.,app_store,plus"
              className="w-full text-xs font-mono p-3 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowPasteZone(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={!pastedContent.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                Ingest Pasted CSV
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Benchmark Datasets Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Or Choose a One-Click Benchmark Dataset:
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click to load &amp; test instantly
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {presets.map((preset) => {
            const isSelected = activeDatasetName === preset.name;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={preset.action}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${preset.badgeColor}`}>
                    {preset.badge}
                  </span>
                  {isSelected && (
                    <span className="flex items-center text-xs font-semibold text-blue-600">
                      <Check className="w-4 h-4 mr-0.5" /> Selected
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900">{preset.name}</div>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {preset.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
