"use client";

import { ScannedPage, FilterType } from "../hooks/usePdfScanner";
import { Wand2, Palette, SunDim, Circle } from "lucide-react";

interface FilterPanelProps {
  page: ScannedPage;
  onUpdate: (id: string, updates: Partial<ScannedPage>) => void;
}

const FILTERS: { type: FilterType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    type: "magic",
    label: "Magic",
    icon: <Wand2 className="w-4 h-4" />,
    description: "Auto-enhance for documents",
  },
  {
    type: "original",
    label: "Original",
    icon: <Circle className="w-4 h-4" />,
    description: "No filter applied",
  },
  {
    type: "grayscale",
    label: "Grayscale",
    icon: <SunDim className="w-4 h-4" />,
    description: "Black & white photo",
  },
  {
    type: "blackwhite",
    label: "B&W",
    icon: <Palette className="w-4 h-4" />,
    description: "High-contrast text",
  },
];

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  displayValue?: string;
}

function Slider({ label, value, min, max, onChange, displayValue }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums font-mono">
          {displayValue ?? value}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
        />
      </div>
    </div>
  );
}

export default function FilterPanel({ page, onUpdate }: FilterPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Filter
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.type}
              onClick={() => onUpdate(page.id, { filter: f.type })}
              className={`
                flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 text-left transition-all duration-200
                ${page.filter === f.type
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-md shadow-blue-500/10"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                }
              `}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                {f.icon}
                {f.label}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">
                {f.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      <div className="space-y-5">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Adjustments
        </h3>

        <Slider
          label="Brightness"
          value={page.brightness}
          min={30}
          max={200}
          onChange={(v) => onUpdate(page.id, { brightness: v })}
          displayValue={`${Math.round((page.brightness / 100 - 1) * 100) >= 0 ? "+" : ""}${Math.round((page.brightness / 100 - 1) * 100)}%`}
        />

        <Slider
          label="Contrast"
          value={page.contrast}
          min={30}
          max={200}
          onChange={(v) => onUpdate(page.id, { contrast: v })}
          displayValue={`${Math.round((page.contrast / 100 - 1) * 100) >= 0 ? "+" : ""}${Math.round((page.contrast / 100 - 1) * 100)}%`}
        />
      </div>

      {/* Live Preview Mini */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Preview
        </h3>
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.processedDataUrl}
            alt="Preview"
            className="w-full object-contain max-h-48"
          />
        </div>
      </div>
    </div>
  );
}
