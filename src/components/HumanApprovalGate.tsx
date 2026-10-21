/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Send,
  FileText,
  Mail,
  Database,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Check,
  ExternalLink,
  Link2,
  CheckCircle2,
} from 'lucide-react';
import { ApprovalRecord, McpDestinationConfig } from '../types';
import { parseGoogleDocUrl } from '../services/mcpClient';

interface HumanApprovalGateProps {
  approvalRecord: ApprovalRecord;
  currentContentHash: string;
  destinations: McpDestinationConfig;
  onToggleDestination: (key: keyof McpDestinationConfig) => void;
  onUpdateGoogleDocsUrl: (url: string) => void;
  onUpdateGoogleDocsWebhook?: (url: string) => void;
  onUpdateGoogleDocsBearerToken?: (token: string) => void;
  onUpdateGoogleDocsMode?: (mode: 'live_webhook' | 'live_oauth' | 'clipboard_assistant') => void;
  onExecuteMcp: () => void;
  isExecuting: boolean;
  simulationConfig: {
    simulateAuthError: boolean;
    simulateTimeout: boolean;
    simulatePartialFailure: boolean;
  };
  onToggleSimulation: (key: 'simulateAuthError' | 'simulateTimeout' | 'simulatePartialFailure') => void;
  onOpenDocModal?: () => void;
}

export const HumanApprovalGate: React.FC<HumanApprovalGateProps> = ({
  approvalRecord,
  currentContentHash,
  destinations,
  onToggleDestination,
  onUpdateGoogleDocsUrl,
  onUpdateGoogleDocsWebhook,
  onUpdateGoogleDocsBearerToken,
  onUpdateGoogleDocsMode,
  onExecuteMcp,
  isExecuting,
  simulationConfig,
  onToggleSimulation,
  onOpenDocModal,
}) => {
  const [showScriptHelper, setShowScriptHelper] = React.useState(false);
  const [copiedScript, setCopiedScript] = React.useState(false);

  const isApproved = approvalRecord.status === 'APPROVED';
  const isHashMatching = approvalRecord.contentHash === currentContentHash;
  const isReadyToDispatch = isApproved && isHashMatching && (destinations.google_docs || destinations.notion || destinations.gmail_draft);

  const parsedDoc = parseGoogleDocUrl(destinations.google_docs_url);
  const activeMode = destinations.google_docs_mode || (destinations.google_docs_webhook_url ? 'live_webhook' : destinations.google_docs_bearer_token ? 'live_oauth' : 'clipboard_assistant');

  const appsScriptCode = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var doc = DocumentApp.getActiveDocument() || DocumentApp.openById(data.documentId);
  var body = doc.getBody();
  body.appendParagraph("\\n" + data.formattedText);
  return ContentService.createTextOutput(JSON.stringify({status: "success", appendedAt: new Date()}))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              {isApproved && isHashMatching ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900">
              MCP External Write Gate (Human-in-the-Loop)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            External writes to Google Docs, Notion, or Gmail drafts are cryptographically gated by mandatory human sign-off.
          </p>
        </div>

        <div>
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isApproved && isHashMatching
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isApproved && isHashMatching ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gate Unlocked (Approved)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Gate Locked (Pending Approval)</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Hash Verification / Invalidation Warning */}
      {!isHashMatching && (
        <div className="my-3.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900">Approval Invalidation: </span>
            The content hash changed since last review. To guarantee that external services only receive explicitly verified text, please review and approve the updated content above before triggering MCP dispatch.
          </div>
        </div>
      )}

      {/* Target Destination Cards */}
      <div className="my-4">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Select Target MCP Destinations for Append/Draft Action:
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Google Docs */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              destinations.google_docs
                ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/10'
                : 'bg-slate-50 border-slate-200 opacity-70'
            }`}
          >
            <label
              onClick={() => onToggleDestination('google_docs')}
              className="flex items-start space-x-3 cursor-pointer"
            >
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={destinations.google_docs}
                  onChange={() => {}}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Append to Google Docs</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Appends structured pulse entry into your existing Google Doc; preserves prior content.
                </p>
              </div>
            </label>

            {/* User-Provided Google Doc Link Configuration */}
            {destinations.google_docs && (
              <div className="mt-3 pt-2.5 border-t border-blue-100 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 flex items-center space-x-1">
                    <Link2 className="w-3 h-3 text-blue-600" />
                    <span>Target Google Doc URL:</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    {parsedDoc.isValid && !parsedDoc.isCreateNew && (
                      <a
                        href={parsedDoc.canonicalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1 text-[10px] font-semibold"
                      >
                        <span>Open Your Doc</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    <a
                      href="https://docs.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 inline-flex items-center space-x-1 text-[10px] font-semibold"
                      title="Create a new document directly in your Google account"
                    >
                      <span>+ New Doc (docs.new)</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={destinations.google_docs_url || ''}
                    onChange={(e) => onUpdateGoogleDocsUrl(e.target.value)}
                    placeholder="Paste your Google Doc URL (e.g. https://docs.google.com/document/d/...)"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-blue-500 font-mono pr-7 shadow-2xs"
                  />
                  {parsedDoc.isValid && !parsedDoc.isCreateNew && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute right-2 top-2" />
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 leading-tight">
                  {parsedDoc.isValid && !parsedDoc.isCreateNew ? (
                    <span className="text-emerald-700 font-medium">
                      ✓ Valid Target Doc: <code className="text-slate-800 font-bold">{parsedDoc.docId.slice(0, 20)}...</code>
                    </span>
                  ) : (
                    <span>
                      💡 Tip: Click <strong className="text-emerald-700">+ New Doc (docs.new)</strong> to open a real document in your Google account, then paste its link here.
                    </span>
                  )}
                  {onOpenDocModal && (
                    <button
                      type="button"
                      onClick={onOpenDocModal}
                      className="ml-2 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline shrink-0"
                    >
                      Open Append Helper
                    </button>
                  )}
                </div>

                {/* Real Live Google Doc Connection Mode Selector */}
                <div className="pt-2 border-t border-blue-100">
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Live Append Connection:</span>
                    <span className="text-blue-600 font-semibold">Real doc append</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border border-slate-200 text-[10px] shadow-2xs">
                    <button
                      type="button"
                      onClick={() => onUpdateGoogleDocsMode?.('clipboard_assistant')}
                      className={`py-1 rounded text-center transition-colors cursor-pointer ${
                        activeMode === 'clipboard_assistant'
                          ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Clipboard (Ctrl+V)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateGoogleDocsMode?.('live_webhook')}
                      className={`py-1 rounded text-center transition-colors cursor-pointer ${
                        activeMode === 'live_webhook'
                          ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Apps Script Webhook
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateGoogleDocsMode?.('live_oauth')}
                      className={`py-1 rounded text-center transition-colors cursor-pointer ${
                        activeMode === 'live_oauth'
                          ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      OAuth Token
                    </button>
                  </div>

                  {/* Mode 1: Clipboard Assistant */}
                  {activeMode === 'clipboard_assistant' && (
                    <div className="mt-2 text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 leading-tight shadow-2xs">
                      <span className="text-emerald-700 font-semibold">Zero-config real write: </span>
                      When executed, the full formatted pulse is copied to your clipboard and your Google Doc opens so you can paste (<kbd className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded border border-slate-300">Ctrl+V</kbd>) into your document immediately.
                    </div>
                  )}

                  {/* Mode 2: Google Apps Script Webhook */}
                  {activeMode === 'live_webhook' && (
                    <div className="mt-2 space-y-1.5">
                      <input
                        type="url"
                        value={destinations.google_docs_webhook_url || ''}
                        onChange={(e) => onUpdateGoogleDocsWebhook?.(e.target.value)}
                        placeholder="Paste your Apps Script Webhook URL..."
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[10px] text-slate-900 font-mono focus:outline-none focus:border-blue-500 shadow-2xs"
                      />
                      <div className="flex items-center justify-between text-[10px]">
                        <button
                          type="button"
                          onClick={() => setShowScriptHelper(!showScriptHelper)}
                          className="text-blue-600 hover:underline flex items-center space-x-1 cursor-pointer font-medium"
                        >
                          <span>{showScriptHelper ? 'Hide 3-line script' : 'How to get Webhook URL in 30s'}</span>
                        </button>
                      </div>

                      {showScriptHelper && (
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[10px] space-y-1 font-sans">
                          <p className="text-slate-700">
                            1. In your Google Doc, click <strong>Extensions &gt; Apps Script</strong>.
                          </p>
                          <p className="text-slate-700">
                            2. Paste this code and click <strong>Deploy &gt; New deployment &gt; Web app (Access: Anyone)</strong>:
                          </p>
                          <div className="relative">
                            <pre className="bg-slate-900 p-2 rounded text-[9px] font-mono text-emerald-300 overflow-x-auto">
                              {appsScriptCode}
                            </pre>
                            <button
                              type="button"
                              onClick={handleCopyScript}
                              className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-200 border border-slate-700 cursor-pointer"
                            >
                              {copiedScript ? 'Copied!' : 'Copy Script'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 3: Direct OAuth Bearer Token */}
                  {activeMode === 'live_oauth' && (
                    <div className="mt-2 space-y-1">
                      <input
                        type="password"
                        value={destinations.google_docs_bearer_token || ''}
                        onChange={(e) => onUpdateGoogleDocsBearerToken?.(e.target.value)}
                        placeholder="Paste Google Bearer token (ya29...)"
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[10px] text-slate-900 font-mono focus:outline-none focus:border-blue-500 shadow-2xs"
                      />
                      <p className="text-[9px] text-slate-500">
                        Sends direct authenticated POST to <code className="text-blue-700 font-mono font-medium">docs.googleapis.com</code> batchUpdate API.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notion Database */}
          <label
            onClick={() => onToggleDestination('notion')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              destinations.notion
                ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/10'
                : 'bg-slate-50 border-slate-200 opacity-70'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={destinations.notion}
                  onChange={() => {}}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <span>Append to Notion Database</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Inserts structured page blocks into Product Pulse database; preserves existing entries.
                </p>
              </div>
            </div>
          </label>

          {/* Gmail Draft Only */}
          <label
            onClick={() => onToggleDestination('gmail_draft')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              destinations.gmail_draft
                ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/10'
                : 'bg-slate-50 border-slate-200 opacity-70'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={destinations.gmail_draft}
                  onChange={() => {}}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Create Gmail Draft ONLY</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Subject: <span className="font-mono text-slate-700">Weekly Product Pulse...</span> Safe draft creation only; NEVER auto-sends.
                </p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Failure Simulation & Test Toggles for Resilience Verification */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 my-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Resilience &amp; Error Handling Simulation Controls:</span>
          <span className="text-[11px] text-blue-700 font-semibold">Mock Sandbox Mode Active</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onToggleSimulation('simulatePartialFailure')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              simulationConfig.simulatePartialFailure
                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            {simulationConfig.simulatePartialFailure && <Check className="w-3 h-3 inline mr-1 text-amber-700" />}
            Simulate Partial Failure (Notion 503)
          </button>

          <button
            onClick={() => onToggleSimulation('simulateTimeout')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              simulationConfig.simulateTimeout
                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            {simulationConfig.simulateTimeout && <Check className="w-3 h-3 inline mr-1 text-amber-700" />}
            Simulate MCP Timeout (5000ms)
          </button>

          <button
            onClick={() => onToggleSimulation('simulateAuthError')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              simulationConfig.simulateAuthError
                ? 'bg-rose-100 text-rose-900 border-rose-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            {simulationConfig.simulateAuthError && <Check className="w-3 h-3 inline mr-1 text-rose-700" />}
            Simulate OAuth 401 Error
          </button>
        </div>
      </div>

      {/* Dispatch Action Execution Trigger */}
      <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Safety Policy: </span>
          Idempotency keys prevent duplicate writes upon network retry. Emails remain drafts only.
        </div>

        <button
          onClick={onExecuteMcp}
          disabled={!isReadyToDispatch || isExecuting}
          className={`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
            isReadyToDispatch && !isExecuting
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-lg'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
          }`}
        >
          {isExecuting ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin text-white" />
              <span>Executing Approved MCP Dispatch...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-white" />
              <span>Execute Approved MCP Write Actions</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
