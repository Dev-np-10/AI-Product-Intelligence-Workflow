import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, Download } from 'lucide-react';
import { SAMPLE_CSV } from '../lib/sampleData.js';
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
export function UploadPanel({ onCsv, loading }) {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [fileName, setFileName] = useState(null);
    const handleFile = useCallback((file) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const text = typeof reader.result === 'string' ? reader.result : '';
            onCsv(text, file.name);
        };
        reader.readAsText(file);
    }, [onCsv]);
    return (_jsxs("section", { className: "rounded-xl border border-slate-200 bg-white p-6 shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900", children: "Upload Reviews CSV" }), _jsxs("p", { className: "mt-1 text-sm text-slate-500", children: ["Upload a CSV of public mobile reviews for ChatGPT Voice Mode. Required columns:", ' ', _jsx("code", { className: "rounded bg-slate-100 px-1 text-xs", children: "author, date, rating, title, body, source" }), "."] }), _jsxs("div", { onDragOver: (e) => {
                    e.preventDefault();
                    setDragOver(true);
                }, onDragLeave: () => setDragOver(false), onDrop: (e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file)
                        handleFile(file);
                }, className: `mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${dragOver ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-slate-50'}`, children: [_jsx(UploadCloud, { className: "h-8 w-8 text-slate-400" }), _jsxs("p", { className: "mt-2 text-sm text-slate-600", children: ["Drag & drop a CSV here, or", ' ', _jsx("button", { type: "button", onClick: () => inputRef.current?.click(), className: "font-semibold text-sky-700 hover:underline", children: "browse" })] }), fileName && (_jsxs("p", { className: "mt-2 flex items-center gap-1.5 text-xs text-slate-500", children: [_jsx(FileSpreadsheet, { className: "h-3.5 w-3.5" }), fileName] })), _jsx("input", { ref: inputRef, type: "file", accept: ".csv,text/csv", className: "hidden", onChange: (e) => {
                            const file = e.target.files?.[0];
                            if (file)
                                handleFile(file);
                        } })] }), _jsxs("div", { className: "mt-4 flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs("button", { type: "button", onClick: () => onCsv(SAMPLE_CSV, 'chatgpt-voice-sample.csv'), disabled: loading, className: "flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50", children: [_jsx(Sparkles, { className: "h-4 w-4" }), "Load sample dataset"] }), _jsxs("button", { type: "button", onClick: downloadSampleCsv, className: "flex items-center gap-2 rounded-lg border border-sky-600 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50", children: [_jsx(Download, { className: "h-4 w-4" }), "Download sample CSV"] })] }), _jsx("span", { className: "text-xs text-slate-400", children: "8 representative reviews included for demo." })] })] }));
}
