import type { FeeExplainer } from '@/types';
import { CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';

interface Props {
  explainer: FeeExplainer;
}

export function FeeExplainerPanel({ explainer }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Neutral Fee Explainer</h2>
        <span className={`flex items-center gap-1.5 text-sm font-medium ${
          explainer.bulletsWithinLimit ? 'text-emerald-600' : 'text-rose-600'
        }`}>
          {explainer.bulletsWithinLimit ? <CheckCircle2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          {explainer.bulletCount} / 6 bullets
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {explainer.bullets.map((b, i) => (
          <li key={i} className="flex gap-3 text-sm text-slate-700">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {i + 1}
            </span>
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-700">Verified official sources</h3>
        <ul className="mt-2 space-y-2">
          {explainer.sources.map((s) => (
            <li key={s.url} className="flex items-start gap-2 text-sm">
              {s.verified ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              )}
              <div>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-sky-700 hover:underline"
                >
                  {s.title}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <p className="text-xs text-slate-500">{s.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
