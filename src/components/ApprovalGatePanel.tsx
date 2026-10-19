import type { McpAction, McpResult } from '@/types';
import { actionTypeLabel } from '@/lib/mcp';
import { CheckCircle2, FileText, Mail, XCircle, Loader2 } from 'lucide-react';

interface Props {
  actions: McpAction[];
  approvedIds: Set<string>;
  results: Record<string, McpResult>;
  pendingIds: Set<string>;
  onToggleApproval: (id: string) => void;
  onExecute: () => void;
  executing: boolean;
  disabled: boolean;
}

function actionIcon(type: McpAction['type']) {
  if (type === 'google-docs') return <FileText className="h-5 w-5" />;
  if (type === 'notion') return <FileText className="h-5 w-5" />;
  return <Mail className="h-5 w-5" />;
}

export function ApprovalGatePanel({
  actions,
  approvedIds,
  results,
  pendingIds,
  onToggleApproval,
  onExecute,
  executing,
  disabled,
}: Props) {
  const approvedCount = approvedIds.size;
  const canExecute = approvedCount > 0 && !executing && !disabled;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">External Actions &amp; Approval Gate</h2>
          <p className="mt-1 text-sm text-slate-500">
            Select each action to approve it. Nothing is written to Google Docs, Notion, or an email
            draft until you explicitly approve and run it. Emails are never sent automatically — only
            a draft is created.
          </p>
        </div>
        <span className="flex-shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {approvedCount} approved
        </span>
      </div>

      <ul className="mt-5 space-y-3">
        {actions.map((action) => {
          const approved = approvedIds.has(action.id);
          const pending = pendingIds.has(action.id);
          const result = results[action.id];
          return (
            <li
              key={action.id}
              className={`rounded-lg border p-4 transition-colors ${
                approved ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'
              }`}
            >
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={() => onToggleApproval(action.id)}
                  disabled={executing || disabled}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700">{actionIcon(action.type)}</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {actionTypeLabel(action.type)}
                    </span>
                    <h3 className="font-semibold text-slate-900">{action.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{action.summary}</p>

                  {pending && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-sky-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running…
                    </div>
                  )}

                  {result && (
                    <div
                      className={`mt-2 flex items-start gap-2 rounded-md p-2 text-sm ${
                        result.success
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">{result.success ? 'Success' : 'Failed'}</p>
                        <p className="text-xs">{result.message}</p>
                        {result.mockRef && (
                          <p className="mt-0.5 font-mono text-xs opacity-70">ref: {result.mockRef}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onExecute}
          disabled={!canExecute}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {executing ? 'Running approved actions…' : `Run ${approvedCount} approved action${approvedCount === 1 ? '' : 's'}`}
        </button>
        {approvedCount === 0 && !disabled && (
          <span className="text-sm text-slate-500">Approve at least one action to continue.</span>
        )}
        {disabled && (
          <span className="text-sm text-amber-600">Upload a valid CSV first to enable external actions.</span>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Demo mode: all external writes use a mock executor. No real Google Docs, Notion, or email
        account is contacted.
      </p>
    </section>
  );
}
