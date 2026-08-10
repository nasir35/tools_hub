"use client";

import { FileText, Download, Loader2, FileImage, AlignCenter } from "lucide-react";
import { PaperSize, Orientation } from "../hooks/usePdfScanner";

interface PdfSettingsPanelProps {
  pageCount: number;
  fileName: string;
  paperSize: PaperSize;
  orientation: Orientation;
  margin: number;
  isGenerating: boolean;
  onFileNameChange: (v: string) => void;
  onPaperSizeChange: (v: PaperSize) => void;
  onOrientationChange: (v: Orientation) => void;
  onMarginChange: (v: number) => void;
  onGenerate: () => void;
}

const PAPER_SIZES: { value: PaperSize; label: string }[] = [
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
  { value: "a3", label: "A3" },
];

export default function PdfSettingsPanel({
  pageCount,
  fileName,
  paperSize,
  orientation,
  margin,
  isGenerating,
  onFileNameChange,
  onPaperSizeChange,
  onOrientationChange,
  onMarginChange,
  onGenerate,
}: PdfSettingsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex gap-3">
        <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{pageCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pages</p>
        </div>
        <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center border border-blue-200 dark:border-blue-800">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{paperSize.toUpperCase()}</p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">Format</p>
        </div>
      </div>

      {/* File Name */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5" />
          File Name
        </label>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden px-3 py-2 focus-within:border-blue-500 transition-colors">
          <input
            type="text"
            value={fileName}
            onChange={(e) => onFileNameChange(e.target.value)}
            placeholder="scanned-document"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
          />
          <span className="text-xs text-slate-400 shrink-0">.pdf</span>
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* Paper Size */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <FileImage className="w-3.5 h-3.5" />
          Paper Size
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PAPER_SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => onPaperSizeChange(s.value)}
              className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                paperSize === s.value
                  ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orientation */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <AlignCenter className="w-3.5 h-3.5" />
          Orientation
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["portrait", "landscape"] as Orientation[]).map((o) => (
            <button
              key={o}
              onClick={() => onOrientationChange(o)}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-1.5 ${
                orientation === o
                  ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-300"
              }`}
            >
              {/* Mini page icon */}
              <div
                className={`border-2 rounded-sm ${orientation === o ? "border-white/70" : "border-slate-400 dark:border-slate-500"}`}
                style={
                  o === "portrait"
                    ? { width: 14, height: 18 }
                    : { width: 18, height: 14 }
                }
              />
              <span className="capitalize">{o}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Margin */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Margin
          </label>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{margin}pt</span>
        </div>
        <input
          type="range"
          min={0}
          max={72}
          step={4}
          value={margin}
          onChange={(e) => onMarginChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>None</span>
          <span>Small</span>
          <span>Large</span>
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={pageCount === 0 || isGenerating}
        className={`
          w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all duration-300
          ${pageCount === 0
            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            : isGenerating
              ? "bg-blue-400 text-white cursor-wait"
              : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02] active:scale-100"
          }
        `}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating PDF…
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Download PDF
          </>
        )}
      </button>

      {pageCount === 0 && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Upload at least one image to generate a PDF
        </p>
      )}
    </div>
  );
}
