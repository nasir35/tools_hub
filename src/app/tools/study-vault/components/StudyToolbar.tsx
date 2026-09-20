"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MousePointer,
  Crop,
  Pen,
  Highlighter,
  Eraser,
  XCircle,
  RotateCcw,
  RotateCw,
  Undo2,
  Redo2,
  Trash2,
  Search,
  BookOpen,
  Maximize,
  Minimize,
  Play,
  Pause,
  Clock,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Bookmark,
} from "lucide-react";

export const PEN_COLORS = [
  { hex: "#1e1e1e", name: "Black" },
  { hex: "#ef4444", name: "Red" },
  { hex: "#f97316", name: "Orange" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#8b5cf6", name: "Purple" },
  { hex: "#ec4899", name: "Pink" },
  { hex: "#10b981", name: "Green" },
  { hex: "#ffffff", name: "White" },
];

export const HIGHLIGHT_COLORS = [
  { hex: "#fbbf24", name: "Yellow" },
  { hex: "#86efac", name: "Green" },
  { hex: "#93c5fd", name: "Blue" },
  { hex: "#f9a8d4", name: "Pink" },
  { hex: "#fca5a5", name: "Red" },
  { hex: "#c4b5fd", name: "Purple" },
];

interface ColorPickerProps {
  colors: { hex: string; name: string }[];
  value: string;
  onChange: (color: string) => void;
  isDarkMode?: boolean;
}

function ColorPicker({ colors, value, onChange, isDarkMode }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const d = isDarkMode;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-6 h-6 rounded-full border-2 border-white shadow-md ring-1 ring-offset-1 ring-blue-500 transition hover:scale-110 flex-shrink-0"
        style={{ background: value }}
        title="Pick color"
      />
      {open && (
        <div
          className={`absolute top-8 left-0 z-50 p-3 rounded-2xl shadow-2xl border w-48 ${
            d ? "bg-slate-800 border-slate-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Preset Colors</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {colors.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => {
                  onChange(c.hex);
                  setOpen(false);
                }}
                title={c.name}
                className={`w-7 h-7 rounded-full border-2 transition hover:scale-110 ${
                  value === c.hex ? "border-blue-500 scale-110 shadow-md" : "border-transparent"
                }`}
                style={{
                  background: c.hex,
                  boxShadow: c.hex === "#ffffff" ? "inset 0 0 0 1px #d1d5db" : undefined,
                }}
              />
            ))}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Custom Hex</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onBlur={() => {
                onChange(custom);
                setOpen(false);
              }}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
            <span className="text-xs font-mono text-gray-400">{custom}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export interface StudyToolbarProps {
  tool: "select" | "pen" | "highlight" | "eraser" | "stroke-eraser" | "snip";
  setTool: (tool: any) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  highlightColor: string;
  setHighlightColor: (color: string) => void;
  penSize: number;
  setPenSize: (size: number) => void;
  currentPage: number;
  totalPages: number;
  onPageInput: (page: number) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomSet: (zoom: number) => void;
  isDarkMode?: boolean;
  snipCount: number;
  onToggleNASPanel: () => void;
  nasPanelOpen: boolean;
  pdfName: string;
  rotation: number;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onClearPage?: () => void;
  onToggleSearch?: () => void;
  searchOpen?: boolean;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  elapsedStudyTime?: number;
  timerRunning?: boolean;
  onToggleTimer?: () => void;
}

export const StudyToolbar: React.FC<StudyToolbarProps> = ({
  tool,
  setTool,
  penColor,
  setPenColor,
  highlightColor,
  setHighlightColor,
  penSize,
  setPenSize,
  currentPage,
  totalPages,
  onPageInput,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomSet,
  isDarkMode = false,
  snipCount,
  onToggleNASPanel,
  nasPanelOpen,
  pdfName,
  rotation,
  onRotateCW,
  onRotateCCW,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onClearPage,
  onToggleSearch,
  searchOpen = false,
  onToggleSidebar,
  sidebarOpen = false,
  elapsedStudyTime = 0,
  timerRunning = true,
  onToggleTimer,
}) => {
  const [pageInput, setPageInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const d = isDarkMode;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const Btn = ({
    icon: Icon,
    label,
    active,
    onClick,
    disabled,
    badge,
  }: {
    icon: any;
    label: string;
    active?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    badge?: number;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition border text-sm ${
        active
          ? "bg-blue-600 text-white border-blue-700 shadow-sm"
          : disabled
          ? "opacity-30 cursor-not-allowed border-transparent text-gray-400"
          : d
          ? "text-gray-300 border-transparent hover:bg-slate-800 hover:text-white"
          : "text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <Icon size={15} />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold px-1 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );

  const Divider = () => <div className={`w-px h-5 mx-0.5 ${d ? "bg-slate-800" : "bg-gray-200"}`} />;

  return (
    <div
      className={`flex items-center gap-1 px-2.5 py-1.5 border-b select-none flex-wrap ${
        d ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
      }`}
    >
      {/* Left drawer toggle */}
      {onToggleSidebar && (
        <Btn
          icon={BookOpen}
          label="Document Navigation & Outline"
          active={sidebarOpen}
          onClick={onToggleSidebar}
        />
      )}

      <span
        className={`text-xs font-semibold truncate max-w-[130px] hidden md:block px-1 ${
          d ? "text-gray-400" : "text-gray-600"
        }`}
        title={pdfName}
      >
        {pdfName}
      </span>

      <Divider />

      {/* Primary tools */}
      <Btn icon={MousePointer} label="Select & Copy Text" active={tool === "select"} onClick={() => setTool("select")} />
      <Btn icon={Crop} label="Snip to Note" active={tool === "snip"} onClick={() => setTool("snip")} />
      <Btn icon={Pen} label="Pen Draw" active={tool === "pen"} onClick={() => setTool("pen")} />
      <Btn icon={Highlighter} label="Highlighter" active={tool === "highlight"} onClick={() => setTool("highlight")} />
      <Btn icon={Eraser} label="Pixel Eraser" active={tool === "eraser"} onClick={() => setTool("eraser")} />
      <Btn icon={XCircle} label="Stroke Eraser (click stroke)" active={tool === "stroke-eraser"} onClick={() => setTool("stroke-eraser")} />

      {/* Pen / Highlight / Eraser Options */}
      {tool === "pen" && (
        <div className="flex items-center gap-1.5 pl-1">
          <ColorPicker colors={PEN_COLORS} value={penColor} onChange={setPenColor} isDarkMode={d} />
          <input
            type="range"
            min="1"
            max="18"
            value={penSize}
            onChange={(e) => setPenSize(+e.target.value)}
            className="w-14 accent-blue-500 cursor-pointer h-1.5"
            title={`Pen Size: ${penSize}px`}
          />
          <span className="text-[10px] font-mono text-gray-400 w-3">{penSize}</span>
        </div>
      )}

      {tool === "highlight" && (
        <div className="flex items-center gap-1.5 pl-1">
          <ColorPicker colors={HIGHLIGHT_COLORS} value={highlightColor} onChange={setHighlightColor} isDarkMode={d} />
          <input
            type="range"
            min="4"
            max="28"
            value={penSize}
            onChange={(e) => setPenSize(+e.target.value)}
            className="w-14 accent-yellow-400 cursor-pointer h-1.5"
            title={`Highlight Size: ${penSize}px`}
          />
          <span className="text-[10px] font-mono text-gray-400 w-3">{penSize}</span>
        </div>
      )}

      {["eraser", "stroke-eraser"].includes(tool) && (
        <div className="flex items-center gap-1.5 pl-1">
          <input
            type="range"
            min="4"
            max="36"
            value={penSize}
            onChange={(e) => setPenSize(+e.target.value)}
            className="w-14 accent-red-400 cursor-pointer h-1.5"
            title={`Eraser Size: ${penSize}px`}
          />
          <span className="text-[10px] font-mono text-gray-400 w-3">{penSize}</span>
        </div>
      )}

      <Divider />

      {/* Undo, Redo, Clear */}
      <Btn icon={Undo2} label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo} />
      <Btn icon={Redo2} label="Redo (Ctrl+Y)" disabled={!canRedo} onClick={onRedo} />
      {onClearPage && (
        <Btn
          icon={Trash2}
          label="Clear Current Page Annotations"
          onClick={() => {
            if (typeof window !== "undefined" && window.confirm("Clear all drawings on this page?")) {
              onClearPage();
            }
          }}
        />
      )}

      <Divider />

      {/* Rotation */}
      <Btn icon={RotateCcw} label="Rotate 90° CCW" onClick={onRotateCCW} />
      <Btn icon={RotateCw} label="Rotate 90° CW" onClick={onRotateCW} />
      {rotation !== 0 && (
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${d ? "bg-slate-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
          {rotation}°
        </span>
      )}

      <div className="flex-1" />

      {/* Live Study Timer */}
      {onToggleTimer && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border font-medium ${
            d ? "bg-slate-800/80 border-slate-700 text-blue-400" : "bg-blue-50 border-blue-100 text-blue-700"
          }`}
        >
          <Clock size={13} className={timerRunning ? "animate-pulse" : "opacity-60"} />
          <span className="font-mono text-xs">{formatTime(elapsedStudyTime)}</span>
          <button
            type="button"
            onClick={onToggleTimer}
            title={timerRunning ? "Pause Study Timer" : "Resume Study Timer"}
            className="hover:scale-110 transition opacity-80 hover:opacity-100 ml-0.5"
          >
            {timerRunning ? <Pause size={12} /> : <Play size={12} />}
          </button>
        </div>
      )}

      <Divider />

      {/* Page Navigation */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onPageInput(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`w-6 h-7 rounded flex items-center justify-center disabled:opacity-30 transition ${
            d ? "text-gray-400 hover:bg-slate-800" : "text-gray-500 hover:bg-gray-100"
          }`}
          title="Previous Page"
        >
          <ChevronLeft size={15} />
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseInt(pageInput);
            if (n >= 1 && n <= totalPages) onPageInput(n);
            setPageInput("");
          }}
        >
          <input
            type="text"
            inputMode="numeric"
            value={pageInput}
            placeholder={String(currentPage)}
            onChange={(e) => setPageInput(e.target.value)}
            className={`w-10 text-center text-xs rounded-md px-1 py-1 border focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${
              d ? "bg-slate-800 border-slate-700 text-gray-200" : "bg-white border-gray-300 text-gray-800"
            }`}
          />
        </form>
        <span className={`text-[11px] font-mono ${d ? "text-gray-500" : "text-gray-400"}`}>/ {totalPages}</span>
        <button
          type="button"
          onClick={() => onPageInput(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`w-6 h-7 rounded flex items-center justify-center disabled:opacity-30 transition ${
            d ? "text-gray-400 hover:bg-slate-800" : "text-gray-500 hover:bg-gray-100"
          }`}
          title="Next Page"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <Divider />

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onZoomOut}
          className={`w-6 h-7 rounded flex items-center justify-center transition ${
            d ? "text-gray-400 hover:bg-slate-800" : "text-gray-500 hover:bg-gray-100"
          }`}
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.target as any)[0] as HTMLInputElement;
            const v = parseInt(input.value);
            if (v >= 30 && v <= 300) onZoomSet(v / 100);
            input.blur();
          }}
        >
          <input
            type="text"
            inputMode="numeric"
            defaultValue={Math.round(zoom * 100)}
            key={Math.round(zoom * 100)}
            onBlur={(e) => {
              const v = parseInt(e.target.value);
              if (v >= 30 && v <= 300) onZoomSet(v / 100);
            }}
            className={`w-11 text-center text-xs rounded-md px-1 py-1 border focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${
              d ? "bg-slate-800 border-slate-700 text-gray-200" : "bg-white border-gray-300 text-gray-800"
            }`}
          />
        </form>
        <span className={`text-[10px] ${d ? "text-gray-500" : "text-gray-400"}`}>%</span>
        <button
          type="button"
          onClick={onZoomIn}
          className={`w-6 h-7 rounded flex items-center justify-center transition ${
            d ? "text-gray-400 hover:bg-slate-800" : "text-gray-500 hover:bg-gray-100"
          }`}
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          type="button"
          onClick={onZoomReset}
          className={`text-[10px] px-1.5 py-1 rounded transition ${
            d ? "text-gray-400 hover:bg-slate-800 hover:text-gray-200" : "text-gray-500 hover:bg-gray-100"
          }`}
          title="Reset to 100%"
        >
          100%
        </button>
      </div>

      <Divider />

      {/* Search */}
      {onToggleSearch && (
        <Btn icon={Search} label="Search in document (Ctrl+F)" active={searchOpen} onClick={onToggleSearch} />
      )}

      {/* Fullscreen */}
      <Btn
        icon={isFullscreen ? Minimize : Maximize}
        label={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
        onClick={toggleFullscreen}
      />

      {/* Snips Panel Toggle Button */}
      <button
        type="button"
        onClick={onToggleNASPanel}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ml-1 ${
          nasPanelOpen
            ? "bg-blue-600 text-white shadow-sm"
            : d
            ? "bg-slate-800 text-gray-200 hover:bg-slate-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        title="Toggle Snips & Notes Panel"
      >
        <Bookmark size={13} />
        <span>Snips</span>
        {snipCount > 0 && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              nasPanelOpen ? "bg-white/20 text-white" : "bg-blue-600 text-white"
            }`}
          >
            {snipCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default StudyToolbar;
