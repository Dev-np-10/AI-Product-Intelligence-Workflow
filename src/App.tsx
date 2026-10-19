import { useCallback, useMemo, useState } from 'react';
import { BarChart3, ShieldCheck } from 'lucide-react';
import type { McpAction, McpResult, ValidationReport } from '@/types';
import { parseCsv } from '@/lib/csvParser';
import { computeDataQuality } from '@/lib/dataQuality';
import { buildFeeExplainer, buildPulseReport, extractFeeEvidence, topThemes } from '@/lib/analysis';
import { buildMcpActions, executeMcpActions, mockMcpExecutor } from '@/lib/mcp';
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
    setMcpResults({});
    setPendingIds(new Set());
    const parsed = parseCsv(csv);
    setParsedRows(parsed);
    setLoading(false);
  }, []);

  const report = useMemo(() => {
    if (!parsedRows) return null;
    return computeDataQuality(parsedRows.rows, parsedRows.errors, parsedRows.missingRequiredColumns);
  }, [parsedRows]);

  const rows = parsedRows?.rows ?? [];

  const themes = useMemo(() => topThemes(rows, 3), [rows]);
  const feeEvidence = useMemo(() => extractFeeEvidence(rows), [rows]);
  const pulse = useMemo(
    () => (rows.length > 0 ? buildPulseReport(rows, themes, feeEvidence) : null),
    [rows, themes, feeEvidence],
  );
  const explainer = useMemo(() => buildFeeExplainer(), []);

  const mcpActions = useMemo<McpAction[]>(() => {
    if (!pulse || rows.length === 0) return [];
    return buildMcpActions({
      pulseTitle: pulse.title,
      pulseBody: pulse.body,
      feeExplainerBullets: explainer.bullets,
      feeExplainerSources: explainer.sources.map((s) => ({ title: s.title, url: s.url })),
      topThemes: themes.map((t) => ({ name: t.name, count: t.count })),
    });
  }, [pulse, rows.length, explainer, themes]);

  const toggleApproval = useCallback((id: string) => {
    setApprovalError(null);
    setApprovedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExecute = useCallback(async () => {
    if (approvedIds.size === 0) {
      setApprovalError('You must approve at least one action before it can run.');
      return;
    }
    setExecuting(true);
    setApprovalError(null);
    setPendingIds(new Set(approvedIds));
    setMcpResults({});

    const results = await executeMcpActions(mcpActions, approvedIds, mockMcpExecutor);
    const byId: Record<string, McpResult> = {};
    results.forEach((r) => {
      byId[r.actionId] = r;
    });
    setMcpResults(byId);
    setPendingIds(new Set());
    setExecuting(false);
  }, [approvedIds, mcpActions]);

  const handleRunValidation = useCallback(async () => {
    setValidationRunning(true);
    const r = await runValidationTests();
    setValidationReport(r);
    setValidationRunning(false);
  }, []);

  const datasetReady = rows.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Voice Pulse</h1>
              <p className="text-xs text-slate-500">ChatGPT Mobile Voice — Weekly Review Workflow</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Approval-gated · Mock integrations
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <UploadPanel onCsv={handleCsv} loading={loading} />

        {parsedRows && parsedRows.missingRequiredColumns.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <p className="font-semibold">CSV is missing required columns.</p>
            <p className="mt-1">
              The file must include:{' '}
              <code className="rounded bg-rose-100 px-1 text-xs">
                {parsedRows.missingRequiredColumns.join(', ')}
              </code>
              . Please re-export the CSV and upload again.
            </p>
          </div>
        )}

        {report && <DataQualityPanel report={report} />}

        {datasetReady && (
          <div className="grid gap-6 lg:grid-cols-2">
            <ThemesPanel themes={themes} />
            <FeeEvidencePanel report={feeEvidence} />
          </div>
        )}

        {datasetReady && pulse && (
          <PulsePanel pulse={pulse} />
        )}

        {datasetReady && (
          <FeeExplainerPanel explainer={explainer} />
        )}

        {datasetReady && (
          <ApprovalGatePanel
            actions={mcpActions}
            approvedIds={approvedIds}
            results={mcpResults}
            pendingIds={pendingIds}
            onToggleApproval={toggleApproval}
            onExecute={handleExecute}
            executing={executing}
            disabled={!datasetReady}
          />
        )}

        {approvalError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {approvalError}
          </div>
        )}

        <ValidationPanel
          report={validationReport}
          running={validationRunning}
          onRun={handleRunValidation}
        />

        <footer className="pt-4 text-center text-xs text-slate-400">
          Voice Pulse · Demo workflow · No real external systems are contacted.
        </footer>
      </main>
    </div>
  );
}

export default App;
