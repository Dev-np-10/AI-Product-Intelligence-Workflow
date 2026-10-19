import type { ValidationReport } from '@/types';
import { CheckCircle2, XCircle, PlayCircle } from 'lucide-react';

interface Props {
  report: ValidationReport | null;
  running: boolean;
  onRun: () => void;
}

export function ValidationPanel({ report, running, onRun }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Validation Tests</h2>
          <p className="mt-1 text-sm text-slate-500">
            Automated checks covering CSV upload, data quality, themes, fee evidence, pulse limits,
            explainer limits, source validation, and approval gating. Uses mock integrations only.
          </p>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className="flex items-center gap-2 rounded-lg border border-sky-600 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
        >
          <PlayCircle className="h-4 w-4" />
          {running ? 'Running…' : 'Run tests'}
        </button>
      </div>

      {report && (
        <div className="mt-5">
          <div className="flex items-center gap-4">
            <div className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              report.failed === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {report.failed === 0 ? 'ALL TESTS PASSED' : `${report.failed} FAILED`}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">{report.passed}</span> passed ·{' '}
              <span className="font-medium text-slate-900">{report.failed}</span> failed ·{' '}
              <span className="font-medium text-slate-900">{report.totalTests}</span> total
            </div>
          </div>

          <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {report.results.map((r, i) => (
              <li key={i} className="flex items-start gap-3 p-3 text-sm">
                {r.passed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
                )}
                <div>
                  <p className={`font-medium ${r.passed ? 'text-slate-800' : 'text-rose-800'}`}>
                    {r.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{r.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
