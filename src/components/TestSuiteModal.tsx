/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { TestSuiteResult } from '../types';
import { runAllValidationTests } from '../tests/validationTestSuite';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestSuiteResult[] | null>(null);
  const [expandedSuiteId, setExpandedSuiteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'results' | 'instructions'>('results');

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults(null);
    try {
      const suiteResults = await runAllValidationTests();
      setResults(suiteResults);
      // Auto-expand first failing or first suite
      const firstFail = suiteResults.find(s => !s.passed);
      setExpandedSuiteId(firstFail ? firstFail.suiteId : suiteResults[0]?.suiteId || null);
    } catch (err) {
      console.error('Test execution failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const totalSuites = results?.length || 0;
  const passedSuites = results?.filter(s => s.passed).length || 0;
  const totalAssertions = results?.reduce((acc, s) => acc + s.assertions.length, 0) || 0;
  const passedAssertions = results?.reduce((acc, s) => acc + s.assertions.filter(a => a.passed).length, 0) || 0;
  const allPassed = totalSuites > 0 && passedSuites === totalSuites;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Automated Validation Test Suite</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  7 Core Requirements
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Mock integrations active • Zero external writes during test runs • Sandboxed execution
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('results')}
              className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'results'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Test Runner &amp; Pass/Fail Report
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'instructions'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Setup Instructions &amp; CLI Commands
            </button>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 my-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running 7 Suites...' : results ? 'Re-Run All Tests' : 'Run All 7 Test Suites'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {activeTab === 'instructions' ? (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="font-bold text-white text-sm mb-2 flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Test Architecture &amp; Mock Sandbox Safety</span>
                </h3>
                <p className="leading-relaxed mb-3 text-slate-300">
                  As specified by the protocol requirement, all automated validation tests run exclusively against <strong className="text-white">mock integrations</strong>. External writes to Google Docs, Notion, or Gmail are completely isolated into local memory storage structures. No production documents or email inboxes are ever touched during automated test execution.
                </p>
                <div className="bg-slate-900 p-3 rounded-lg font-mono text-[11px] text-slate-300 space-y-1 border border-slate-800">
                  <p className="text-emerald-400 font-bold"># Test Command Execution:</p>
                  <p className="text-slate-200">$ npm run lint           # Static TypeScript schema and type validation</p>
                  <p className="text-slate-200">$ npm run build          # Production bundle compilation and asset checks</p>
                  <p className="text-slate-400"># Interactive test execution runs in-browser via the validation test suite runner</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="font-bold text-slate-200 mb-1.5">Required Coverage Matrix:</div>
                  <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                    <li>Valid CSV &amp; Missing Columns Schema</li>
                    <li>Empty Datasets, Duplicates &amp; Malformed Dates</li>
                    <li>Theme Volume Counts &amp; Verbatim Quote Matching</li>
                    <li>Insufficient Fee Evidence Guardrail</li>
                    <li>Pulse ≤250 Words, Explainer ≤6 Bullets &amp; Link Whitelist</li>
                    <li>Approval Gating &amp; Invalidation on Modification</li>
                    <li>MCP Timeout, Auth 401 &amp; Partial Failure Handling</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="font-bold text-slate-200 mb-1.5">Email Safety Invariant:</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Under no circumstances does the system execute automatic email sending. All email actions strictly invoke the <code className="text-indigo-300">gmail_create_draft</code> protocol with <code className="text-indigo-300">autoSend: false</code>, depositing the message into the user&apos;s Gmail Drafts folder for manual human sending.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Scorecard if run */}
              {results && (
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    allPassed
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {allPassed ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">
                        {allPassed ? 'All 7 Validation Test Suites Passed (100% Green)' : 'Some Test Suites Failed'}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {passedSuites} of {totalSuites} test suites passed • {passedAssertions} of {totalAssertions} assertions verified
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
                    Status: <span className={allPassed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {allPassed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </div>
              )}

              {/* No results yet state */}
              {!results && !isRunning && (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <PlayCircle className="w-12 h-12 text-indigo-400 mx-auto opacity-75" />
                  <p className="text-sm font-medium text-slate-200">
                    Ready to execute automated validation test suites.
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Click the button below to execute all 7 requirement categories with assertion checks against mock integrations.
                  </p>
                  <button
                    onClick={handleRunTests}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-colors cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Run All 7 Test Suites Now</span>
                  </button>
                </div>
              )}

              {/* Running State */}
              {isRunning && (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <RotateCcw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-sm font-medium text-slate-200">
                    Executing test suites across data quality, quote verification, word limits, and gated MCP dispatches...
                  </p>
                </div>
              )}

              {/* Test Suites Accordion */}
              {results && (
                <div className="space-y-3">
                  {results.map((suite) => {
                    const isExpanded = expandedSuiteId === suite.suiteId;
                    const passedCount = suite.assertions.filter(a => a.passed).length;

                    return (
                      <div
                        key={suite.suiteId}
                        className={`rounded-xl border transition-all ${
                          suite.passed
                            ? 'bg-slate-950/60 border-slate-800'
                            : 'bg-rose-950/20 border-rose-800/60'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedSuiteId(isExpanded ? null : suite.suiteId)}
                          className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            {suite.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <div>
                              <div className="text-xs font-bold text-white">{suite.title}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{suite.description}</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 text-xs">
                            <span className="font-mono text-slate-400 text-[11px]">
                              {passedCount}/{suite.assertions.length} passed ({suite.elapsedMs}ms)
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </button>

                        {/* Expanded Assertions */}
                        {isExpanded && (
                          <div className="p-3.5 pt-0 border-t border-slate-800/80 space-y-2 mt-2">
                            {suite.assertions.map((assertion, aIdx) => (
                              <div
                                key={`assert_${aIdx}`}
                                className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-start space-x-2 text-xs"
                              >
                                {assertion.passed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <div className="font-semibold text-slate-200">{assertion.name}</div>
                                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                    {assertion.details}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Automated test validation suite built according to test harness specifications.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
