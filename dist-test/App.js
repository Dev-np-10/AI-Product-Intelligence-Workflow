import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { BarChart3, ShieldCheck } from 'lucide-react';
import { parseCsv } from './lib/csvParser.js';
import { computeDataQuality } from './lib/dataQuality.js';
import { buildFeeExplainer, buildPulseReport, extractFeeEvidence, topThemes } from './lib/analysis.js';
import { buildMcpActions, executeMcpActions, mockMcpExecutor } from './lib/mcp.js';
import { runValidationTests } from './lib/validationTests.js';
import { UploadPanel } from './components/UploadPanel.js';
import { DataQualityPanel } from './components/DataQualityPanel.js';
import { ThemesPanel } from './components/ThemesPanel.js';
import { FeeEvidencePanel } from './components/FeeEvidencePanel.js';
import { PulsePanel } from './components/PulsePanel.js';
import { FeeExplainerPanel } from './components/FeeExplainerPanel.js';
import { ApprovalGatePanel } from './components/ApprovalGatePanel.js';
import { ValidationPanel } from './components/ValidationPanel.js';
function App() {
    const [parsedRows, setParsedRows] = useState(null);
    const [approvalError, setApprovalError] = useState(null);
    const [approvedIds, setApprovedIds] = useState(new Set());
    const [mcpResults, setMcpResults] = useState({});
    const [pendingIds, setPendingIds] = useState(new Set());
    const [executing, setExecuting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validationReport, setValidationReport] = useState(null);
    const [validationRunning, setValidationRunning] = useState(false);
    const handleCsv = useCallback((csv, _fileName) => {
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
        if (!parsedRows)
            return null;
        return computeDataQuality(parsedRows.rows, parsedRows.errors, parsedRows.missingRequiredColumns);
    }, [parsedRows]);
    const rows = parsedRows?.rows ?? [];
    const themes = useMemo(() => topThemes(rows, 3), [rows]);
    const feeEvidence = useMemo(() => extractFeeEvidence(rows), [rows]);
    const pulse = useMemo(() => (rows.length > 0 ? buildPulseReport(rows, themes, feeEvidence) : null), [rows, themes, feeEvidence]);
    const explainer = useMemo(() => buildFeeExplainer(), []);
    const mcpActions = useMemo(() => {
        if (!pulse || rows.length === 0)
            return [];
        return buildMcpActions({
            pulseTitle: pulse.title,
            pulseBody: pulse.body,
            feeExplainerBullets: explainer.bullets,
            feeExplainerSources: explainer.sources.map((s) => ({ title: s.title, url: s.url })),
            topThemes: themes.map((t) => ({ name: t.name, count: t.count })),
        });
    }, [pulse, rows.length, explainer, themes]);
    const toggleApproval = useCallback((id) => {
        setApprovalError(null);
        setApprovedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
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
        const byId = {};
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
    return (_jsxs("div", { className: "min-h-screen bg-slate-50 text-slate-900", children: [_jsx("header", { className: "sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur", children: _jsxs("div", { className: "mx-auto flex max-w-6xl items-center justify-between px-4 py-4", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white", children: _jsx(BarChart3, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-base font-semibold leading-tight", children: "Voice Pulse" }), _jsx("p", { className: "text-xs text-slate-500", children: "ChatGPT Mobile Voice \u2014 Weekly Review Workflow" })] })] }), _jsxs("div", { className: "flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700", children: [_jsx(ShieldCheck, { className: "h-3.5 w-3.5" }), "Approval-gated \u00B7 Mock integrations"] })] }) }), _jsxs("main", { className: "mx-auto max-w-6xl space-y-6 px-4 py-8", children: [_jsx(UploadPanel, { onCsv: handleCsv, loading: loading }), parsedRows && parsedRows.missingRequiredColumns.length > 0 && (_jsxs("div", { className: "rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800", children: [_jsx("p", { className: "font-semibold", children: "CSV is missing required columns." }), _jsxs("p", { className: "mt-1", children: ["The file must include:", ' ', _jsx("code", { className: "rounded bg-rose-100 px-1 text-xs", children: parsedRows.missingRequiredColumns.join(', ') }), ". Please re-export the CSV and upload again."] })] })), report && _jsx(DataQualityPanel, { report: report }), datasetReady && (_jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsx(ThemesPanel, { themes: themes }), _jsx(FeeEvidencePanel, { report: feeEvidence })] })), datasetReady && pulse && (_jsx(PulsePanel, { pulse: pulse })), datasetReady && (_jsx(FeeExplainerPanel, { explainer: explainer })), datasetReady && (_jsx(ApprovalGatePanel, { actions: mcpActions, approvedIds: approvedIds, results: mcpResults, pendingIds: pendingIds, onToggleApproval: toggleApproval, onExecute: handleExecute, executing: executing, disabled: !datasetReady })), approvalError && (_jsx("div", { className: "rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800", children: approvalError })), _jsx(ValidationPanel, { report: validationReport, running: validationRunning, onRun: handleRunValidation }), _jsx("footer", { className: "pt-4 text-center text-xs text-slate-400", children: "Voice Pulse \u00B7 Demo workflow \u00B7 No real external systems are contacted." })] })] }));
}
export default App;
