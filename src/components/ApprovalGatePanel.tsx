import { useEffect, useState } from 'react';
import type { McpAction, McpResult } from '@/types';
import { actionTypeLabel } from '@/lib/mcp';
import { CheckCircle2, FileText, Mail, XCircle, Loader2, Pencil, Ban } from 'lucide-react';

interface Props {
  actions: McpAction[];
  approvedIds: Set<string>;
  results: Record<string, McpResult>;
  pendingIds: Set<string>;
  onToggleApproval: (id: string) => void;
  onEditPayload: (id: string, payload: unknown) => void;
  onReject: () => void;
  onExecute: () => void;
  executing: boolean;
  disabled: boolean;
}

function actionIcon(type: McpAction['type']) {
  return type === 'email-draft' ? <Mail className="h-5 w-5" /> : <FileText className="h-5 w-5" />;
}

function ActionReview({ action, approved, pending, result, disabled, executing, onToggle, onEdit }: {
  action: McpAction; approved: boolean; pending: boolean; result?: McpResult;
  disabled: boolean; executing: boolean; onToggle: () => void; onEdit: (payload: unknown) => void;
}) {
  const [draft, setDraft] = useState(JSON.stringify(action.payload, null, 2));
  const [editMode, setEditMode] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  useEffect(() => { setDraft(JSON.stringify(action.payload, null, 2)); }, [action.payload]);
  const save = () => {
    try {
      const parsed: unknown = JSON.parse(draft);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Payload must be a JSON object.');
      if (action.type === 'email-draft') {
        const email = parsed as { subject?: unknown; body?: unknown };
        if (typeof email.subject !== 'string' || !email.subject.startsWith('Weekly Product Pulse + Customer Clarification — '))
          throw new Error('The required email subject must be preserved.');
        if (typeof email.body !== 'string' || !email.body.trim()) throw new Error('Email body is required.');
      }
      onEdit(parsed);
      setEditMode(false);
      setEditError(null);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Invalid JSON payload.');
    }
  };
  return <li className={`rounded-lg border p-4 ${approved ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'}`}>
    <div className="flex items-start gap-3">
      <input aria-label={`Approve exact payload for ${action.title}`} type="checkbox" checked={approved}
        onChange={onToggle} disabled={executing || disabled}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-700">{actionIcon(action.type)}</span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{actionTypeLabel(action.type)}</span>
          <h3 className="font-semibold text-slate-900">{action.title}</h3>
        </div>
        <p className="mt-1 text-sm text-slate-600">{action.summary}</p>
        <details className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3" open>
          <summary className="cursor-pointer text-sm font-medium text-slate-700">Review exact payload</summary>
          {editMode ? <div className="mt-2 space-y-2">
            <textarea aria-label={`Edit payload for ${action.title}`} value={draft} onChange={(event) => setDraft(event.target.value)}
              rows={12} spellCheck={false} className="w-full rounded-md border border-slate-300 bg-white p-3 font-mono text-xs text-slate-800 focus:border-sky-500 focus:outline-none" />
            {editError && <p role="alert" className="text-sm text-rose-700">{editError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={save} className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white">Save edits (clear approvals)</button>
              <button type="button" onClick={() => { setDraft(JSON.stringify(action.payload, null, 2)); setEditMode(false); setEditError(null); }}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">Cancel</button>
            </div>
          </div> : <div className="mt-2">
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md bg-white p-3 text-xs text-slate-700">{JSON.stringify(action.payload, null, 2)}</pre>
            <button type="button" disabled={executing || disabled} onClick={() => setEditMode(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50"><Pencil className="h-3.5 w-3.5" /> Edit payload</button>
          </div>}
        </details>
        {approved && <p className="mt-2 text-xs font-medium text-sky-800">Approved for this exact payload. Any edit clears all approvals.</p>}
        {pending && <div className="mt-2 flex items-center gap-2 text-sm text-sky-700"><Loader2 className="h-4 w-4 animate-spin" /> Running…</div>}
        {result && <div className={`mt-2 flex items-start gap-2 rounded-md p-2 text-sm ${result.success ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
          {result.success ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
          <div><p className="font-medium">{result.success ? 'Confirmed by integration' : 'Not confirmed / failed'}</p><p className="text-xs">{result.message}</p>
            {result.mockRef && <p className="mt-0.5 font-mono text-xs opacity-70">reference: {result.mockRef}</p>}</div>
        </div>}
      </div>
    </div>
  </li>;
}

export function ApprovalGatePanel(props: Props) {
  const { actions, approvedIds, results, pendingIds, onToggleApproval, onEditPayload, onReject, onExecute, executing, disabled } = props;
  const approvedCount = approvedIds.size;
  const canExecute = approvedCount > 0 && !executing && !disabled;
  return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-lg font-semibold text-slate-900">Review, Approve &amp; Execute</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">Inspect the exact payload for every destination. Edit or reject before execution. Saving any edit invalidates all approvals. Gmail actions create drafts only and never send.</p>
      </div>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{approvedCount} approved</span>
    </div>
    <ul className="mt-5 space-y-3">{actions.map((action) => <ActionReview key={action.id} action={action}
      approved={approvedIds.has(action.id)} pending={pendingIds.has(action.id)} result={results[action.id]}
      disabled={disabled} executing={executing} onToggle={() => onToggleApproval(action.id)}
      onEdit={(payload) => onEditPayload(action.id, payload)} />)}</ul>
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button type="button" onClick={onExecute} disabled={!canExecute}
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300">
        {executing ? 'Running approved actions…' : `Run ${approvedCount} approved action${approvedCount === 1 ? '' : 's'}`}
      </button>
      <button type="button" onClick={onReject} disabled={executing || approvedCount === 0}
        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"><Ban className="h-4 w-4" /> Reject review</button>
      {disabled && <span className="text-sm text-amber-700">Upload a valid CSV first to enable actions.</span>}
    </div>
    <p className="mt-3 text-xs text-slate-500">No mock success is reported. Without a configured server-side MCP gateway, actions fail closed. Provider credentials must stay server-side. Verify provider state before retrying any timed-out operation.</p>
  </section>;
}
