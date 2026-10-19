import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, Download } from 'lucide-react';
import { SAMPLE_CSV } from '@/lib/sampleData';

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'chatgpt-voice-sample.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface Props {
  onCsv: (csv: string, fileName: string) => void;
  loading: boolean;
}

export function UploadPanel({ onCsv, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === 'string' ? reader.result : '';
        onCsv(text, file.name);
      };
      reader.readAsText(file);
    },
    [onCsv],
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Upload Reviews CSV</h2>
      <p className="mt-1 text-sm text-slate-500">
        Upload a CSV of public mobile reviews for ChatGPT Voice Mode. Required columns:{' '}
        <code className="rounded bg-slate-100 px-1 text-xs">author, date, rating, title, body, source</code>.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-slate-50'
        }`}
      >
        <UploadCloud className="h-8 w-8 text-slate-400" />
        <p className="mt-2 text-sm text-slate-600">
          Drag &amp; drop a CSV here, or{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-sky-700 hover:underline"
          >
            browse
          </button>
        </p>
        {fileName && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {fileName}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onCsv(SAMPLE_CSV, 'chatgpt-voice-sample.csv')}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Load sample dataset
          </button>
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="flex items-center gap-2 rounded-lg border border-sky-600 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
          >
            <Download className="h-4 w-4" />
            Download sample CSV
          </button>
        </div>
        <span className="text-xs text-slate-400">
          8 representative reviews included for demo.
        </span>
      </div>
    </section>
  );
}
