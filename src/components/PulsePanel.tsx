import type { PulseReport } from '@/types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  pulse: PulseReport;
}

export function PulsePanel({ pulse }: Props) {
  const limitOk = !pulse.tooLong;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Weekly Product Pulse</h2>
        <span className={`flex items-center gap-1.5 text-sm font-medium ${
          limitOk ? 'text-emerald-600' : 'text-rose-600'
        }`}>
          {limitOk ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {pulse.wordCount} / 250 words
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">{pulse.title}</p>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm leading-relaxed text-slate-800">{pulse.body}</p>
      </div>

      {pulse.tooLong && (
        <p className="mt-2 text-sm text-rose-600">
          The pulse exceeds the 250-word limit. Trim the content before exporting.
        </p>
      )}
    </section>
  );
}
