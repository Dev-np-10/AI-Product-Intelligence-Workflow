/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  RotateCcw,
  Code,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  Database,
  Mail,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { McpActionResult } from '../types';
import { copyToClipboard } from '../utils/clipboardHelper';

interface McpDispatchDrawerProps {
  results: McpActionResult[];
  onRetryFailed: () => void;
  isRetrying: boolean;
  onOpenDocModal?: () => void;
}

export const McpDispatchDrawer: React.FC<McpDispatchDrawerProps> = ({
  results,
  onRetryFailed,
  isRetrying,
  onOpenDocModal,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (results.length === 0) {
    return null;
  }

  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const failureCount = results.filter(r => r.status === 'FAILED').length;
  const hasFailures = failureCount > 0;

  const handleCopyIdempotency = (key: string) => {
    copyToClipboard(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyText = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const getToolIcon = (tool: string) => {
    if (tool.includes('google_docs')) return <FileText className="w-4 h-4 text-blue-600" />;
    if (tool.includes('notion')) return <Database className="w-4 h-4 text-teal-600" />;
    return <Mail className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-slate-900 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Terminal className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900">MCP Protocol Action Execution Log</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirmed external actions with JSON-RPC 2.0 inspectability and idempotent retry protection.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {hasFailures ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle className="w-3.5 h-3.5" />
              <span>Partial / Full Failures ({failureCount})</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>All Actions Processed ({successCount}/{results.length})</span>
            </span>
          )}

          {hasFailures && (
            <button
              onClick={onRetryFailed}
              disabled={isRetrying}
              className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>Retry Failed</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Results List */}
      <div className="space-y-3 mt-4">
        {results.map((res, idx) => {
          const isExpanded = expandedIndex === idx;
          const isSuccess = res.status === 'SUCCESS';
          const isGoogleDocs = res.tool.includes('google_docs');
          const isClipboardMode = res.deliveryMode === 'CLIPBOARD_ASSIST';
          const isLiveWrite = res.deliveryMode === 'REAL_LIVE_WRITE';

          return (
            <div
              key={`mcp_res_${idx}`}
              className={`rounded-xl border transition-all ${
                isSuccess
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center space-x-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    {getToolIcon(res.tool)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{res.destinationName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        {res.tool}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(res.timestamp).toLocaleTimeString()} ({res.executionDurationMs}ms)</span>
                      <span>•</span>
                      <button
                        onClick={() => handleCopyIdempotency(res.idempotencyKey)}
                        className="font-mono text-[10px] text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer font-medium"
                        title="Click to copy idempotency key"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        <span>{copiedKey === res.idempotencyKey ? 'Copied' : res.idempotencyKey.slice(0, 18) + '...'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                  {/* Append Helper Modal Trigger for Google Docs */}
                  {isGoogleDocs && onOpenDocModal && (
                    <button
                      onClick={onOpenDocModal}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs cursor-pointer"
                      title="Open 2-step Google Doc append helper"
                    >
                      <FileText className="w-3.5 h-3.5 text-white" />
                      <span>Append Helper</span>
                    </button>
                  )}

                  {Boolean(res.responsePayload?.documentUrl) ? (
                    <a
                      href={String(res.responsePayload?.documentUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-blue-700 border border-slate-200 transition-colors shadow-2xs"
                      title={
                        String(res.responsePayload?.documentUrl).includes('docs.new')
                          ? 'Open new Google Doc in your Google account'
                          : 'Open target Google Doc'
                      }
                    >
                      <span>
                        {String(res.responsePayload?.documentUrl).includes('docs.new')
                          ? 'Open New Doc (docs.new)'
                          : 'Open Your Doc'}
                      </span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  ) : null}

                  {Boolean(res.responsePayload?.formattedText) ? (
                    <button
                      onClick={() => handleCopyText(String(res.responsePayload?.formattedText), `text_${idx}`)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                      title="Copy formatted text to clipboard"
                    >
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>{copiedKey === `text_${idx}` ? 'Copied!' : 'Copy Text'}</span>
                    </button>
                  ) : null}

                  {isSuccess ? (
                    isLiveWrite ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Live Write Confirmed</span>
                      </span>
                    ) : isClipboardMode ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Copy className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ready in Clipboard (Ctrl+V)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Confirmed Success</span>
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Action Failed</span>
                    </span>
                  )}

                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    title="Toggle JSON-RPC payload inspection"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Informative notification for Clipboard Mode */}
              {isGoogleDocs && isClipboardMode && isSuccess && (
                <div className="mx-4 mb-3.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start space-x-2">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-blue-950">Clipboard Ready: </span>
                    The complete formatted pulse entry was copied to your clipboard. Simply open your Google Doc and press <kbd className="px-1.5 py-0.5 rounded bg-white border border-blue-200 text-blue-900 font-mono text-[11px] shadow-2xs">Ctrl+V</kbd> (or <kbd className="px-1.5 py-0.5 rounded bg-white border border-blue-200 text-blue-900 font-mono text-[11px] shadow-2xs">Cmd+V</kbd>). Click <strong>Append Helper</strong> above if you need to copy again or download as a .doc file.
                  </div>
                </div>
              )}

              {/* Error Message if Failed */}
              {res.error && (
                <div className="mx-4 mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-mono">
                  {res.error}
                </div>
              )}

              {/* JSON-RPC Protocol Drawer Inspector */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-3 border-t border-slate-200 bg-white rounded-b-xl space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
                      <Code className="w-3.5 h-3.5 text-blue-600" />
                      <span>MCP Protocol JSON-RPC Inspection</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Key: {res.idempotencyKey}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-semibold mb-1">
                        Request Payload:
                      </div>
                      <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-200 overflow-x-auto max-h-48">
                        {JSON.stringify(res.requestPayload, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-semibold mb-1">
                        Response Payload:
                      </div>
                      <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-[11px] text-emerald-300 overflow-x-auto max-h-48">
                        {JSON.stringify(res.responsePayload || { error: res.error }, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
