import type { FeeEvidenceReport } from '@/types';
import { AlertTriangle, DollarSign } from 'lucide-react';

interface Props {
  report: FeeEvidenceReport;
}

export function FeeEvidencePanel({ report }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Fee-Related Evidence</h2>
        <span className="text-sm text-slate-500">{report.totalFeeMentions} mentions</span>
      </div>

      {report.insufficient ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Insufficient fee evidence.</p>
            <p className="mt-1">
              Only {report.totalFeeMentions} review(s) mention fees, pricing, or subscriptions.
              A minimum of 3 is required before drawing fee-related conclusions.
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          Direct quotes from reviews mentioning fees, pricing, subscriptions, or charges.
        </p>
      )}

      {report.items.length > 0 && (
        <ul className="mt-4 space-y-3">
          {report.items.map((item, i) => (
            <li key={i} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  {item.author} · {item.date}
                </span>
                <span className={`rounded-full px-2 py-0.5 font-medium ${
                  item.sentiment === 'negative' ? 'bg-rose-100 text-rose-700' :
                  item.sentiment === 'neutral' ? 'bg-slate-100 text-slate-600' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {item.sentiment} · {item.rating}★
                </span>
              </div>
              <blockquote className="mt-2 text-sm italic text-slate-700">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
