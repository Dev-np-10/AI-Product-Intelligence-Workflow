import { useCallback, useMemo, useState } from 'react';
import { BarChart3, ShieldCheck } from 'lucide-react';
import type { McpAction, McpResult, ValidationReport } from '@/types';
import { parseCsv } from '@/lib/csvParser';
import { computeDataQuality } from '@/lib/dataQuality';
import { buildFeeExplainer, buildPulseReport, extractFeeEvidence, topThemes } from '@/lib/analysis';
import { buildMcpActions, executeMcpActions, configuredMcpExecutor } from '@/lib/mcp';
import { runValidationTests } from '@/lib/validationTests';
import { UploadPanel } from '@/components/UploadPanel';
import { DataQualityPanel } from '@/components/DataQualityPanel';
import { ThemesPanel } from '@/components/ThemesPanel';
import { FeeEvidencePanel } from '@/components/FeeEvidencePanel';
import { PulsePanel } from '@/components/PulsePanel';
import { FeeExplainerPanel } from '@/components/FeeExplainerPanel';
import { ApprovalGatePanel } from '@/components/ApprovalGatePanel';
import { ValidationPanel } from '@/components/ValidationPanel';

function App() {
  const [parsedRows, setParsedRows] = useState<ReturnType<typeof parseCsv> | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [editedPayloads, setEditedPayloads] = useState<Record<string, unknown>>({});
  const [mcpResults, setMcpResults] = useState<Record<string, McpResult>>({});
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [executing, setExecuting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [validationRunning, setValidationRunning] = useState(false);

  const handleCsv = useCallback((csv: string, _fileName: string) => {
    setLoading(true);
    setApprovalError(null);
    setApprovedIds(new Set());
    setEditedPayloads({});
    setMcpResults({});
    setPendingIds(new Set());
    setParsedRows(parseCsv(csv));
    setLoading(false);
  }, []);

  const report = useMemo(() => parsedRows
    ? computeDataQuality(parsedRows.rows, parsedRows.errors, parsedRows.missingRequiredColumns)
    : null, [parsedRows]);
  const rows = parsedRows?.rows ?? [];
  const themes = useMemo(() => topThemes(rows, 3), [rows]);
  const feeEvidence = useMemo(() => extractFeeEvidence(rows), [rows]);
  const pulse = useMemo(() => rows.length > 0 ? buildPulseReport(rows, themes, feeEvidence) : null, [rows, themes, feeEvidence]);
  const explainer = useMemo(() => buildFeeExplainer(), []);

  const baseActions = useMemo<McpAction[]>(() => {
    if (!pulse || rows.length === 0) return [];
    const identifiedFeeIssue = feeEvidence.items.length
      ? `${feeEvidence.totalFeeMentions} fee-related review mention(s) detected; review the evidence before treating these as a confirmed product issue.`
      : 'No fee-related issue detected in the supplied review sample.';
    return buildMcpActions({
      pulseTitle: pulse.title,
      pulseBody: pulse.body,
      feeExplainerBullets: explainer.bullets,
      feeExplainerSources: explainer.sources.map((source) => ({ title: source.title, url: source.url })),
      topThemes: themes.map((theme) => ({ name: theme.name, count: theme.count })),
      identifiedFeeIssue,
    });
  }, [pulse, rows.length, explainer, themes, feeEvidence]);

  const mcpActions = useMemo(() => baseActions.map((action) =>
    Object.prototype.hasOwnProperty.call(editedPayloads, action.id)
      ? { ...action, payload: editedPayloads[action.id] }
      : action,
  ), [baseActions, editedPayloads]);

  const toggleApproval = useCallback((id: string) => {
    setApprovalError(null);
    setApprovedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const editPayload = useCallback((id: string, payload: unknown) => {
    setEditedPayloads((previous) => ({ ...previous, [id]: payload }));
    // Any edit changes the exact approved content: invalidate every prior approval and result.
    setApprovedIds(new Set());
    setMcpResults({});
    setApprovalError('Content changed. All approvals were cleared; review the updated payload and approve again.');
  }, []);

  const rejectAll = useCallback(() => {
    setApprovedIds(new Set());
    setMcpResults({});
    setApprovalError('Review rejected. No external action was run.');
  }, []);

  const handleExecute = useCallback(async () => {
    if (approvedIds.size === 0) {
      setApprovalError('Approve the exact content of at least one action before it can run.');
      return;
    }
    setExecuting(true);
    setApprovalError(null);
    setPendingIds(new Set(approvedIds));
    setMcpResults({});
    try {
      const results = await executeMcpActions(mcpActions, approvedIds, configuredMcpExecutor);
      const byId: Record<string, McpResult> = {};
      results.forEach((result) => { byId[result.actionId] = result; });
      setMcpResults(byId);
    } finally {
      setPendingIds(new Set());
      setExecuting(false);
    }
  }, [approvedIds, mcpActions]);

  const handleRunValidation = useCallback(async () => {
    setValidationRunning(true);
    try { setValidationReport(await runValidationTests()); }
    finally { setValidationRunning(false); }
  }, []);
  const datasetReady = rows.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white"><BarChart3 className="h-5 w-5" /></div>
            <div><h1 className="text-base font-semibold leading-tight">Voice Pulse</h1><p className="text-xs text-slate-500">ChatGPT Mobile Voice — Weekly Review Workflow</p></div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            <ShieldCheck className="h-3.5 w-3.5" /> Human approval required · Integrations configurable
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <UploadPanel onCsv={handleCsv} loading={loading} />
        {parsedRows && parsedRows.missingRequiredColumns.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <p className="font-semibold">CSV is missing required columns.</p>
            <p className="mt-1">The file must include: <code className="rounded bg-rose-100 px-1 text-xs">{parsedRows.missingRequiredColumns.join(', ')}</code>. Please re-export the CSV and upload again.</p>
          </div>
        )}
        {report && <DataQualityPanel report={report} />}
        {datasetReady && <div className="grid gap-6 lg:grid-cols-2"><ThemesPanel themes={themes} /><FeeEvidencePanel report={feeEvidence} /></div>}
        {datasetReady && pulse && <PulsePanel pulse={pulse} />}
        {datasetReady && <FeeExplainerPanel explainer={explainer} />}
        {datasetReady && <ApprovalGatePanel
          actions={mcpActions}
          approvedIds={approvedIds}
          results={mcpResults}
          pendingIds={pendingIds}
          onToggleApproval={toggleApproval}
          onEditPayload={editPayload}
          onReject={rejectAll}
          onExecute={handleExecute}
          executing={executing}
          disabled={!datasetReady}
        />}
        {approvalError && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{approvalError}</div>}
        <ValidationPanel report={validationReport} running={validationRunning} onRun={handleRunValidation} />
        <footer className="pt-4 text-center text-xs text-slate-400">
          Voice Pulse · External actions require a configured server-side MCP gateway. Gmail drafts are never sent automatically.
        </footer>
      </main>
    </div>
  );
}
export default App;
