"use client";

import React from "react";
import { Plus, FileText } from "lucide-react";
import { NoteEntry, ProjectEntry } from "../utils/types";
import { NoteCard } from "./NoteCard";

interface NotesGridProps {
  notes: NoteEntry[];
  projects?: ProjectEntry[];
  viewMode?: "large" | "medium" | "list" | string;
  onSelectNote: (note: NoteEntry) => void;
  onEditNote?: (note: NoteEntry) => void;
  onDeleteNote?: (id: string) => void;
  onTogglePin?: (id: string, currentPin: boolean) => void;
  onCreateNote?: () => void;
  isDarkMode?: boolean;
}

export const NotesGrid: React.FC<NotesGridProps> = ({
  notes,
  projects = [],
  viewMode = "medium",
  onSelectNote,
  onCreateNote,
  isDarkMode = false,
}) => {
  const d = isDarkMode;

  const projectMap = React.useMemo(() => {
    const map = new Map<string, ProjectEntry>();
    for (const p of projects) {
      map.set(p.id, p);
    }
    return map;
  }, [projects]);

  if (notes.length === 0) {
    return (
      <div
        className={`py-20 text-center rounded-3xl border p-8 space-y-3 ${
          d ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
            d ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
          }`}
        >
          <FileText size={28} />
        </div>
        <h3 className={`text-base font-bold ${d ? "text-white" : "text-slate-900"}`}>
          No notes here yet
        </h3>
        <p className={`text-xs max-w-sm mx-auto ${d ? "text-slate-400" : "text-slate-600"}`}>
          Capture ideas, class summaries, formulas, and study snippets in this project.
        </p>
        {onCreateNote && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onCreateNote}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus size={14} />
              <span>Create First Note</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            project={note.projectId ? projectMap.get(note.projectId) : null}
            viewMode="list"
            onClick={() => onSelectNote(note)}
            isDarkMode={d}
          />
        ))}
      </div>
    );
  }

  const gridCols =
    viewMode === "large"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

  return (
    <div className={gridCols}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          project={note.projectId ? projectMap.get(note.projectId) : null}
          viewMode={viewMode}
          onClick={() => onSelectNote(note)}
          isDarkMode={d}
        />
      ))}
    </div>
  );
};

export default NotesGrid;
