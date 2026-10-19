import type { DataQualityReport } from '@/types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  report: DataQualityReport;
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone: 'good' | 'warn' | 'bad' }) {
  const colors = {
    good: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    warn: 'bg-amber-50 text-amber-900 border-amber-200',
    bad: 'bg-rose-50 text-rose-900 border-rose-200',
  } as const;
  const Icon = tone === 'good' ? CheckCircle2 : tone === 'warn' ? AlertTriangle : XCircle;
  return (
    <div className={`rounded-lg border p-4 ${colors[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function DataQualityPanel({ report }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Data Quality Checks</h2>
      <p className="mt-1 text-sm text-slate-500">
        Automated checks on the uploaded CSV before any analysis runs.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Valid rows" value={report.validRows} tone={report.validRows > 0 ? 'good' : 'bad'} />
        <StatCard label="Duplicates" value={report.duplicateRows} tone={report.duplicateRows === 0 ? 'good' : 'warn'} />
        <StatCard label="Malformed dates" value={report.malformedDates} tone={report.malformedDates === 0 ? 'good' : 'warn'} />
        <StatCard label="Missing required" value={report.missingRequired} tone={report.missingRequired === 0 ? 'good' : 'bad'} />
        <StatCard label="Invalid ratings" value={report.invalidRatings} tone={report.invalidRatings === 0 ? 'good' : 'warn'} />
        <StatCard
          label="Date range"
          value={report.dateRange.earliest ? `${report.dateRange.earliest} → ${report.dateRange.latest}` : '—'}
          tone={report.dateRange.earliest ? 'good' : 'bad'}
        />
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-700">Rating distribution</h3>
        <div className="mt-2 flex items-end gap-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = report.ratingBreakdown[star] ?? 0;
            const max = Math.max(1, ...Object.values(report.ratingBreakdown));
            const heightPct = (count / max) * 100;
            return (
              <div key={star} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end justify-center rounded-md bg-slate-100">
                  <div
                    className="w-2/3 rounded-t bg-sky-500"
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                    aria-label={`${count} ${star}-star reviews`}
                  />
                </div>
                <span className="text-xs text-slate-500">{star}★ ({count})</span>
              </div>
            );
          })}
        </div>
      </div>

      {report.issues.length > 0 && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">Issues detected ({report.issues.length})</h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {report.issues.slice(0, 10).map((issue, i) => (
              <li key={i} className="flex gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{issue.message}</span>
              </li>
            ))}
            {report.issues.length > 10 && (
              <li className="italic opacity-70">…and {report.issues.length - 10} more.</li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
