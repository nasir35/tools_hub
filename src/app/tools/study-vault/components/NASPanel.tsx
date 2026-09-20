"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bookmark,
  FileDown,
  X,
  Maximize2,
  Trash2,
  Edit3,
  Search,
  GripVertical,
  ExternalLink,
  Check,
  Copy,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Snip } from "../utils/types";

export const getSnipImageUrl = (pathOrUrl?: string | null): string => {
  if (!pathOrUrl) return "";
  return String(pathOrUrl).replace(/\\/g, "/");
};

// ─── Fullscreen Snip Viewer ──────────────────────────────────────────────────
interface SnipViewerProps {
  snips: Snip[];
  startIndex: number;
  onClose: () => void;
  isDarkMode?: boolean;
}

const SnipViewer: React.FC<SnipViewerProps> = ({ snips, startIndex, onClose, isDarkMode }) => {
  const [idx, setIdx] = useState(startIndex);
  const [copied, setCopied] = useState(false);
  const snip = snips[idx];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setIdx((i) => Math.min(snips.length - 1, i + 1));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [snips.length, onClose]);

  const copyImage = async () => {
    if (!snip) return;
    try {
      const url = getSnipImageUrl(snip.attachmentPath || snip.filename);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d")?.drawImage(img, 0, 0);
        c.toBlob(async (blob) => {
          if (blob && navigator.clipboard?.write) {
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        });
      };
    } catch {}
  };

  const downloadImage = () => {
    if (!snip) return;
    const url = getSnipImageUrl(snip.attachmentPath || snip.filename);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snip_page_${snip.page}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!snip) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 shrink-0 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-white text-sm font-semibold">
            Snip {idx + 1} of {snips.length}
          </span>
          <span className="text-blue-400 text-xs bg-blue-500/20 px-2.5 py-0.5 rounded-full font-medium">
            Page {snip.page}
          </span>
          {snip.pdfName && (
            <span className="text-gray-400 text-xs max-w-[240px] truncate hidden sm:inline">
              📄 {snip.pdfName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyImage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition font-medium"
            title="Copy snip image to clipboard"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
          <button
            type="button"
            onClick={downloadImage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition font-medium"
            title="Download snip image"
          >
            <Download size={13} />
            <span>Download</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition ml-2"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Note Banner */}
      {snip.note && (
        <div className="px-6 py-2.5 shrink-0 bg-blue-950/40 border-b border-blue-900/30">
          <p className="text-blue-200 text-sm italic font-medium">"{snip.note}"</p>
        </div>
      )}

      {/* Image Container */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0 relative">
        <img
          src={getSnipImageUrl(snip.attachmentPath || snip.filename)}
          alt={`Snip ${idx + 1}`}
          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/5"
          style={{ imageRendering: "crisp-edges" }}
        />

        {/* Previous button */}
        {idx > 0 && (
          <button
            type="button"
            onClick={() => setIdx((i) => i - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm border border-white/10"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Next button */}
        {idx < snips.length - 1 && (
          <button
            type="button"
            onClick={() => setIdx((i) => i + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm border border-white/10"
            title="Next (Right Arrow)"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Footer thumbnail dots & navigation */}
      <div className="flex items-center justify-center gap-4 pb-4 pt-2 shrink-0">
        <button
          type="button"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition disabled:opacity-30 font-medium"
        >
          ← Prev
        </button>
        <div className="flex gap-1.5">
          {snips.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === idx ? "bg-blue-400 scale-125" : "bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIdx((i) => Math.min(snips.length - 1, i + 1))}
          disabled={idx === snips.length - 1}
          className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition disabled:opacity-30 font-medium"
        >
          Next →
        </button>
      </div>
      <p className="text-center text-gray-500 text-[11px] pb-3">Use ← → arrow keys to navigate · Esc to close</p>
    </div>
  );
};

// ─── Single Snip Card ─────────────────────────────────────────────────────────
interface SnipCardProps {
  snip: Snip;
  index: number;
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onOpenFullscreen: (index: number) => void;
  onJumpToPage?: (page: number, rect?: any) => void;
  isDarkMode?: boolean;
}

const SnipCard: React.FC<SnipCardProps> = ({
  snip,
  index,
  onDelete,
  onUpdateNote,
  onOpenFullscreen,
  onJumpToPage,
  isDarkMode,
}) => {
  const d = isDarkMode;
  const [editNote, setEditNote] = useState(false);
  const [note, setNote] = useState(snip.note || "");

  const saveNote = useCallback(() => {
    onUpdateNote(snip.id, note);
    setEditNote(false);
  }, [snip.id, note, onUpdateNote]);

  return (
    <div
      className={`group rounded-xl border transition shadow-sm overflow-hidden ${
        d ? "bg-slate-800/90 border-slate-700/80 hover:border-blue-500/50" : "bg-white border-gray-200 hover:border-blue-400"
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center gap-1.5 px-3 pt-2 pb-1.5 text-xs">
        <GripVertical size={13} className={`cursor-grab opacity-40 hover:opacity-100 ${d ? "text-gray-400" : "text-gray-500"}`} />
        <span className={`font-semibold text-[11px] flex-1 truncate ${d ? "text-gray-300" : "text-gray-700"}`}>
          #{index + 1} · p.{snip.page}
          {snip.pdfName && <span className="font-normal opacity-60 ml-1">· {snip.pdfName}</span>}
        </span>

        {/* Jump to page button */}
        {onJumpToPage && (
          <button
            type="button"
            onClick={() => onJumpToPage(snip.page, snip.rect)}
            className={`p-1 rounded transition text-[10px] flex items-center gap-1 font-medium ${
              d ? "text-blue-400 hover:bg-slate-700" : "text-blue-600 hover:bg-blue-50"
            }`}
            title={`Jump to page ${snip.page} in document`}
          >
            <ExternalLink size={12} />
            <span>p.{snip.page}</span>
          </button>
        )}

        {/* Fullscreen button */}
        <button
          type="button"
          onClick={() => onOpenFullscreen(index)}
          className={`p-1 rounded transition ${d ? "text-gray-400 hover:text-white hover:bg-slate-700" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
          title="Open fullscreen preview"
        >
          <Maximize2 size={12} />
        </button>

        {/* Delete button */}
        <button
          type="button"
          onClick={() => onDelete(snip.id)}
          className={`p-1 rounded transition ${d ? "text-gray-400 hover:text-red-400 hover:bg-slate-700" : "text-gray-400 hover:text-red-600 hover:bg-red-50"}`}
          title="Delete snip"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Snip Image Preview */}
      <div
        className="cursor-pointer bg-slate-950/20 mx-2.5 mb-2 rounded-lg overflow-hidden max-h-32 flex items-center justify-center border border-black/5 relative group/img"
        onClick={() => onOpenFullscreen(index)}
      >
        <img
          src={getSnipImageUrl(snip.attachmentPath || snip.filename)}
          alt={`Snip ${index + 1}`}
          className="w-full object-cover group-hover/img:scale-102 transition duration-200"
          style={{ imageRendering: "crisp-edges" }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition flex items-center justify-center">
          <Maximize2 size={16} className="text-white opacity-0 group-hover/img:opacity-100 transition drop-shadow" />
        </div>
      </div>

      {/* Note Area */}
      <div className="px-2.5 pb-2.5">
        {editNote ? (
          <div className="space-y-1.5">
            <textarea
              autoFocus
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveNote();
                if (e.key === "Escape") setEditNote(false);
              }}
              placeholder="Add key findings or notes… (Ctrl+Enter to save)"
              className={`w-full text-xs p-2 rounded-lg border resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans ${
                d ? "bg-slate-700 border-slate-600 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
              }`}
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={saveNote}
                className="flex-1 text-xs py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium flex items-center justify-center gap-1"
              >
                <Check size={11} />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNote(snip.note || "");
                  setEditNote(false);
                }}
                className={`flex-1 text-xs py-1 rounded-md transition font-medium ${
                  d ? "bg-slate-700 text-gray-300 hover:bg-slate-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditNote(true)}
            className={`text-xs p-1.5 rounded-lg cursor-text min-h-[26px] transition flex items-start justify-between group/note ${
              snip.note
                ? d
                  ? "text-gray-200 hover:bg-slate-700/60"
                  : "text-gray-800 hover:bg-gray-50"
                : d
                ? "text-gray-500 italic hover:bg-slate-700/40"
                : "text-gray-400 italic hover:bg-gray-50"
            }`}
            title="Click to edit note"
          >
            <span className="flex-1">{snip.note || "Add a note to this snip…"}</span>
            <Edit3
              size={11}
              className={`opacity-0 group-hover/note:opacity-60 transition ml-1 shrink-0 ${
                d ? "text-gray-400" : "text-gray-500"
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main NAS Panel ──────────────────────────────────────────────────────────
export interface NASPanelProps {
  session?: {
    id?: string;
    title?: string;
    pdfName?: string;
    snips?: Snip[];
    updatedAt?: string | null;
  } | null;
  onClose?: () => void;
  onDeleteSnip: (id: string) => void;
  onUpdateSnipNote: (id: string, note: string) => void;
  onReorderSnips?: (snips: Snip[]) => void;
  onDownload?: () => void;
  onJumpToPage?: (page: number, rect?: any) => void;
  isDarkMode?: boolean;
}

export const NASPanel: React.FC<NASPanelProps> = ({
  session,
  onClose,
  onDeleteSnip,
  onUpdateSnipNote,
  onReorderSnips,
  onDownload,
  onJumpToPage,
  isDarkMode = false,
}) => {
  const d = isDarkMode;
  const [filter, setFilter] = useState("");
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const snips = session?.snips || [];

  const filtered = filter
    ? snips.filter(
        (s) =>
          s.note?.toLowerCase().includes(filter.toLowerCase()) ||
          String(s.page).includes(filter) ||
          s.pdfName?.toLowerCase().includes(filter.toLowerCase())
      )
    : snips;

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragging(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(idx);
  };
  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragging === null || dragging === idx) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const newSnips = [...snips];
    const [moved] = newSnips.splice(dragging, 1);
    newSnips.splice(idx, 0, moved);
    onReorderSnips?.(newSnips);
    setDragging(null);
    setDragOver(null);
  };
  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  return (
    <>
      <div className={`flex flex-col h-full ${d ? "bg-slate-900" : "bg-gray-50"}`}>
        {/* Panel Header */}
        <div
          className={`px-3.5 py-3 border-b shrink-0 ${
            d ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Bookmark size={15} className="text-blue-500" />
              <span className={`font-bold text-sm ${d ? "text-gray-100" : "text-gray-900"}`}>
                Snips
              </span>
              <span
                className={`text-[11px] px-2 py-0.2 rounded-full font-mono font-semibold ${
                  d ? "bg-blue-600/20 text-blue-300" : "bg-blue-100 text-blue-700"
                }`}
              >
                {snips.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  title="Export Snips to PDF document"
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition font-medium ${
                    d
                      ? "bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <FileDown size={13} />
                  <span>Export PDF</span>
                </button>
              )}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className={`p-1 rounded-lg transition ${
                    d ? "text-gray-400 hover:text-white hover:bg-slate-800" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                  title="Close panel"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <p className={`text-[11px] truncate mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>
            {session?.pdfName || session?.title || "Study Session"}
          </p>

          {/* Quick Filter */}
          {snips.length > 2 && (
            <div className="relative">
              <Search
                size={12}
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${
                  d ? "text-gray-500" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search notes or page number…"
                className={`w-full text-xs pl-7 pr-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  d
                    ? "bg-slate-800 border-slate-700 text-gray-200 placeholder-gray-500"
                    : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"
                }`}
              />
            </div>
          )}
        </div>

        {/* Snips List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3 text-blue-500">
                <Bookmark size={24} />
              </div>
              <p className={`text-xs font-medium ${d ? "text-gray-400" : "text-gray-600"}`}>
                {snips.length === 0
                  ? "No snips yet — click ✂ in toolbar and drag over any area"
                  : "No snips match your filter"}
              </p>
            </div>
          ) : (
            filtered.map((snip, i) => {
              const realIdx = snips.indexOf(snip);
              return (
                <div
                  key={snip.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, realIdx)}
                  onDragOver={(e) => handleDragOver(e, realIdx)}
                  onDrop={(e) => handleDrop(e, realIdx)}
                  onDragEnd={handleDragEnd}
                  className={`transition-all ${
                    dragOver === realIdx ? "ring-2 ring-blue-500 rounded-xl" : ""
                  } ${dragging === realIdx ? "opacity-30" : ""}`}
                >
                  <SnipCard
                    snip={snip}
                    index={i}
                    onDelete={onDeleteSnip}
                    onUpdateNote={onUpdateSnipNote}
                    onOpenFullscreen={() => setViewerIdx(i)}
                    onJumpToPage={onJumpToPage}
                    isDarkMode={d}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Panel Footer */}
        {snips.length > 0 && (
          <div
            className={`px-3.5 py-2 border-t text-[11px] flex justify-between items-center ${
              d ? "border-slate-800 text-gray-500" : "border-gray-200 text-gray-400"
            }`}
          >
            <span>{snips.length} snip{snips.length !== 1 ? "s" : ""} captured</span>
            <span className="font-mono">
              {session?.updatedAt
                ? new Date(session.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Active"}
            </span>
          </div>
        )}
      </div>

      {viewerIdx !== null && (
        <SnipViewer
          snips={filtered}
          startIndex={viewerIdx}
          onClose={() => setViewerIdx(null)}
          isDarkMode={d}
        />
      )}
    </>
  );
};

export default NASPanel;
