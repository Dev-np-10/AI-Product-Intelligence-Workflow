/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Calendar,
  Copy,
  Layers,
  FileCheck,
} from 'lucide-react';
import { DataQualityReport } from '../types';

interface DataQualityCardProps {
  report: DataQualityReport;
}

export const DataQualityCard: React.FC<DataQualityCardProps> = ({ report }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FileCheck className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Data Quality &amp; Hygiene Audit</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated schema verification, duplicate screening, date standardization, and input sanitization.
          </p>
        </div>

        <div>
          {report.isValid ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dataset Passed Quality Checks</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle className="w-3.5 h-3.5" />
              <span>Data Quality Errors Detected</span>
            </span>
          )}
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 my-4">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Valid Reviews</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{report.validRows}</div>
          <div className="text-[11px] text-slate-500">of {report.totalRows} raw rows</div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Duplicates</span>
            <Copy className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{report.duplicateCount}</div>
          <div className="text-[11px] text-slate-500">De-duplicated</div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Malformed Dates</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{report.malformedDateCount}</div>
          <div className="text-[11px] text-slate-500">Normalized/flagged</div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Sanitized Inputs</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{report.sanitizationCount}</div>
          <div className="text-[11px] text-slate-500">Untrusted chars cleaned</div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Empty Reviews</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{report.emptyReviewCount}</div>
          <div className="text-[11px] text-slate-500">Skipped blanks</div>
        </div>
      </div>

      {/* Flexible Column Mapping & Detected Headers */}
      <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4 mb-3">
        <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Flexible Column Mapping (No Mandatory Column Constraint)</span>
          <span className="text-[11px] text-blue-600 font-semibold">
            Auto-detected &amp; mapped
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
          <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs text-[11px]">
            <span className="text-slate-500 block">Review Text:</span>
            <span className="text-blue-900 font-mono font-semibold truncate block">
              {report.columnMappings?.review_text || 'Detected'}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs text-[11px]">
            <span className="text-slate-500 block">Review ID:</span>
            <span className="text-blue-900 font-mono font-semibold truncate block">
              {report.columnMappings?.review_id || 'Detected'}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs text-[11px]">
            <span className="text-slate-500 block">Date:</span>
            <span className="text-blue-900 font-mono font-semibold truncate block">
              {report.columnMappings?.date || 'Detected'}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs text-[11px]">
            <span className="text-slate-500 block">Rating:</span>
            <span className="text-blue-900 font-mono font-semibold truncate block">
              {report.columnMappings?.rating || 'Detected'}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center flex-wrap gap-1.5 pt-2 border-t border-blue-100/60">
          <span className="font-medium text-slate-700">Detected CSV Headers:</span>
          {report.detectedColumns.map((col) => (
            <span
              key={col}
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-white text-slate-700 border border-slate-200 shadow-2xs"
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" />
              <span>{col}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Warnings & Errors List */}
      {(report.errors.length > 0 || report.warnings.length > 0) && (
        <div className="space-y-2 mt-3">
          {report.errors.map((err, i) => (
            <div key={`err_${i}`} className="flex items-start space-x-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          ))}
          {report.warnings.map((warn, i) => (
            <div key={`warn_${i}`} className="flex items-start space-x-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
