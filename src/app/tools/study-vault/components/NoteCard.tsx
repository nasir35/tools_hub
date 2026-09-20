"use client";

import React from "react";
import {
  FileText,
  Image as ImageIcon,
  BookOpen,
  Pin,
  Trash2,
  Edit3,
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
  isDarkMode?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  project,
  viewMode = "medium",
  onClick,
  onEdit,
  onDelete,
  onTogglePin,
  isDarkMode = false,
}) => {
  const d = isDarkMode;

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
      className={`group rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
        d
          ? "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-100 shadow-sm"
          : "bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-sm hover:shadow-md"
      } ${
        note.pinned
          ? d
            ? "ring-1 ring-amber-400/40 border-amber-400/30"
            : "ring-1 ring-amber-500/50 border-amber-400 bg-amber-50/20"
          : ""
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
            className={`font-bold truncate flex-1 group-hover:text-blue-500 transition-colors ${
              d ? "text-white" : "text-slate-900"
            } ${viewMode === "compact" ? "text-xs" : "text-sm"}`}
          >
            {note.title || "Untitled Note"}
          </h3>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
            {onTogglePin && (
              <button
                type="button"
                onClick={onTogglePin}
                title={note.pinned ? "Unpin note" : "Pin note to top"}
                className={`p-1 rounded transition ${
                  d
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                } ${note.pinned ? "text-amber-500" : ""}`}
              >
                <Pin size={13} className={note.pinned ? "fill-amber-500" : ""} />
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              title="Edit Note"
              className={`p-1 rounded transition ${
                d ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Edit3 size={13} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Delete Note"
              className={`p-1 rounded transition ${
                d ? "text-slate-400 hover:text-red-400 hover:bg-slate-800" : "text-slate-400 hover:text-red-600 hover:bg-red-50"
              }`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        {cleanPreview && viewMode !== "compact" && (
          <p
            className={`text-xs leading-relaxed ${d ? "text-slate-400" : "text-slate-600"} ${
              viewMode === "expanded" ? "line-clamp-6" : "line-clamp-3"
            }`}
          >
            {cleanPreview}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        className={`pt-3 mt-2 border-t flex items-center justify-between gap-2 text-[11px] ${
          d ? "border-slate-800/80" : "border-slate-100"
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {project && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold truncate max-w-[110px]"
              style={{
                backgroundColor: d ? `${project.color}33` : `${project.color}1a`,
                color: project.color,
                border: `1px solid ${project.color}40`,
              }}
            >
              {project.name}
            </span>
          )}

          {imagesCount > 0 && (
            <span
              className={`flex items-center gap-0.5 ${d ? "text-slate-400" : "text-slate-500"}`}
              title={`${imagesCount} images`}
            >
              <ImageIcon size={11} className="text-emerald-500" />
              <span>{imagesCount}</span>
            </span>
          )}

          {pdfsCount > 0 && (
            <span
              className={`flex items-center gap-0.5 ${d ? "text-slate-400" : "text-slate-500"}`}
              title={`${pdfsCount} PDFs`}
            >
              <BookOpen size={11} className="text-blue-500" />
              <span>{pdfsCount}</span>
            </span>
          )}
        </div>

        <span
          className={`font-mono text-[10px] shrink-0 ${d ? "text-slate-500" : "text-slate-400"}`}
        >
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
