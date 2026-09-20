"use client";

import React from "react";
import {
  FileText,
  Image as ImageIcon,
  BookOpen,
  Pin,
  Trash2,
  Edit3,
  Paperclip,
} from "lucide-react";
import { NoteEntry, ProjectEntry } from "../utils/types";

interface NoteCardProps {
  note: NoteEntry;
  project?: ProjectEntry | null;
  viewMode?: "compact" | "medium" | "expanded";
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onTogglePin?: (e: React.MouseEvent) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  project,
  viewMode = "medium",
  onClick,
  onEdit,
  onDelete,
  onTogglePin,
}) => {
  // Strip HTML tags for preview text
  const cleanPreview = React.useMemo(() => {
    if (!note.content) return "";
    return note.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }, [note.content]);

  const imagesCount = (note.attachments || []).filter(
    (a) => a.type?.startsWith("image/") || a.path?.match(/\.(png|jpe?g|gif|webp)$/i)
  ).length;

  const pdfsCount = (note.attachments || []).filter(
    (a) => a.type === "application/pdf" || a.path?.match(/\.pdf$/i)
  ).length;

  return (
    <div
      onClick={onClick}
      className={`group rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-xl ${
        note.pinned ? "ring-1 ring-amber-400/40 border-amber-400/30" : ""
      } ${
        viewMode === "compact"
          ? "p-3.5 min-h-[90px]"
          : viewMode === "expanded"
          ? "p-5 min-h-[220px]"
          : "p-4 min-h-[160px]"
      }`}
    >
      {/* Top accent strip if project has color */}
      {project?.color && (
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: project.color }}
        />
      )}

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3
            className={`font-bold text-white truncate flex-1 group-hover:text-blue-400 transition-colors ${
              viewMode === "compact" ? "text-xs" : "text-sm"
            }`}
          >
            {note.title || "Untitled Note"}
          </h3>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
            {onTogglePin && (
              <button
                type="button"
                onClick={onTogglePin}
                title={note.pinned ? "Unpin note" : "Pin note to top"}
                className={`p-1 rounded hover:bg-slate-800 transition ${
                  note.pinned ? "text-amber-400" : "text-slate-400 hover:text-white"
                }`}
              >
                <Pin size={13} className={note.pinned ? "fill-amber-400" : ""} />
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              title="Edit Note"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Edit3 size={13} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Delete Note"
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        {cleanPreview && viewMode !== "compact" && (
          <p
            className={`text-slate-400 text-xs leading-relaxed ${
              viewMode === "expanded" ? "line-clamp-6" : "line-clamp-3"
            }`}
          >
            {cleanPreview}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 flex-wrap">
          {project && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white truncate max-w-[110px]"
              style={{ backgroundColor: `${project.color}33`, color: project.color }}
            >
              {project.name}
            </span>
          )}

          {imagesCount > 0 && (
            <span className="flex items-center gap-0.5 text-slate-400" title={`${imagesCount} images`}>
              <ImageIcon size={11} className="text-emerald-400" />
              <span>{imagesCount}</span>
            </span>
          )}

          {pdfsCount > 0 && (
            <span className="flex items-center gap-0.5 text-slate-400" title={`${pdfsCount} PDFs`}>
              <BookOpen size={11} className="text-blue-400" />
              <span>{pdfsCount}</span>
            </span>
          )}
        </div>

        <span className="text-slate-500 font-mono text-[10px] shrink-0">
          {new Date(note.updatedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
};

export default NoteCard;
