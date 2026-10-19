import type { Theme } from '@/types';
import { Quote } from 'lucide-react';

interface Props {
  themes: Theme[];
}

export function ThemesPanel({ themes }: Props) {
  const top = themes.slice(0, 3);
  const rest = themes.slice(3);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Top 3 Themes</h2>
      <p className="mt-1 text-sm text-slate-500">
        Themes ranked by how many reviews mention them, with a verbatim representative quote.
      </p>

      {top.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No themes found in the dataset.</p>
      ) : (
        <ol className="mt-5 space-y-4">
          {top.map((theme, i) => (
            <li key={theme.name} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-slate-900">{theme.name}</h3>
                </div>
                <span className="text-sm font-medium text-slate-500">{theme.count} reviews</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {theme.keywords.map((kw) => (
                  <span key={kw} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {kw}
                  </span>
                ))}
              </div>

              {theme.representativeQuote && (
                <figure className="mt-3 border-l-2 border-sky-400 pl-3">
                  <Quote className="h-4 w-4 text-sky-400" />
                  <blockquote className="mt-1 text-sm italic text-slate-700">
                    &ldquo;{theme.representativeQuote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-1 text-xs text-slate-500">
                    — {theme.quoteAuthor}, {theme.quoteDate}
                  </figcaption>
                </figure>
              )}
            </li>
          ))}
        </ol>
      )}

      {rest.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-700">Other themes</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {rest.map((t) => (
              <li key={t.name} className="flex justify-between">
                <span>{t.name}</span>
                <span className="text-slate-400">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
