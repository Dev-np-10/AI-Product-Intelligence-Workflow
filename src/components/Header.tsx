/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, RefreshCw, Sparkles, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { ApprovalStatus } from '../types';

interface HeaderProps {
  currentTab: 'upload' | 'dashboard';
  onTabChange: (tab: 'upload' | 'dashboard') => void;
  hasData: boolean;
  approvalStatus: ApprovalStatus;
  onResetToHealthy: () => void;
  datasetName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  hasData,
  approvalStatus,
  onResetToHealthy,
  datasetName,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs text-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                ChatGPT Voice Pulse &amp; MCP Dispatcher
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                HITL Governance
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Active Dataset: <span className="text-blue-900 font-semibold">{datasetName}</span>
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onTabChange('upload')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'upload'
                  ? 'bg-white text-blue-700 shadow-xs border border-blue-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>
            <button
              onClick={() => onTabChange('dashboard')}
              disabled={!hasData}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-xs border border-blue-100'
                  : hasData
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 opacity-50 cursor-not-allowed'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Pulse Dashboard</span>
            </button>
          </div>

          {/* Approval Status Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white border-slate-200 shadow-xs">
            <span className="text-slate-500">Approval:</span>
            {approvalStatus === 'APPROVED' ? (
              <span className="inline-flex items-center text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Approved
              </span>
            ) : approvalStatus === 'REJECTED' ? (
              <span className="inline-flex items-center text-rose-600 font-semibold">
                Rejected
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-700 font-semibold">
                Pending
              </span>
            )}
          </div>

          {/* Reset button */}
          <button
            onClick={onResetToHealthy}
            title="Reload healthy benchmark dataset"
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 hover:text-blue-600" />
            <span className="hidden sm:inline">Reset Sample</span>
          </button>
        </div>
      </div>
    </header>
  );
};
