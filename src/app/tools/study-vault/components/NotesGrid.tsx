"use client";

import React from "react";
import { Plus, FileText } from "lucide-react";
import { NoteEntry, ProjectEntry } from "../utils/types";
import { NoteCard } from "./NoteCard";

interface NotesGridProps {
  notes: NoteEntry[];
  projects: ProjectEntry[];
  viewMode?: "compact" | "medium" | "expanded";
  onSelectNote: (note: NoteEntry) => void;
  onEditNote: (note: NoteEntry) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin?: (id: string, currentPin: boolean) => void;
  onCreateNote: () => void;
}

export const NotesGrid: React.FC<NotesGridProps> = ({
  notes,
  projects,
  viewMode = "medium",
  onSelectNote,
  onEditNote,
  onDeleteNote,
  onTogglePin,
  onCreateNote,
}) => {
  const projectMap = React.useMemo(() => {
    const map = new Map<string, ProjectEntry>();
    for (const p of projects) {
      map.set(p.id, p);
    }
    return map;
  }, [projects]);

  if (notes.length === 0) {
    return (
      <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
          <FileText size={28} />
        </div>
        <h3 className="text-base font-bold text-white">No notes here yet</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Capture ideas, class summaries, formulas, and study snippets in this project.
        </p>
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
      </div>
    );
  }

  const gridClass =
    viewMode === "compact"
      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
      : viewMode === "expanded"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4";

  return (
    <div className={gridClass}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          project={note.projectId ? projectMap.get(note.projectId) : null}
          viewMode={viewMode}
          onClick={() => onSelectNote(note)}
          onEdit={(e) => {
            e.stopPropagation();
            onEditNote(note);
          }}
          onDelete={(e) => {
            e.stopPropagation();
            onDeleteNote(note.id);
          }}
          onTogglePin={
            onTogglePin
              ? (e) => {
                  e.stopPropagation();
                  onTogglePin(note.id, !!note.pinned);
                }
              : undefined
          }
        />
      ))}
    </div>
  );
};

export default NotesGrid;
