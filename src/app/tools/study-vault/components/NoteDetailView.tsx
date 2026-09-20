"use client";

import React from "react";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  BookOpen,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { NoteEntry, ProjectEntry } from "../utils/types";

interface NoteDetailViewProps {
  note: NoteEntry;
  project?: ProjectEntry | null;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenStudyPdf?: (pdfUrl: string, name: string) => void;
  isDarkMode?: boolean;
}

export const NoteDetailView: React.FC<NoteDetailViewProps> = ({
  note,
  project,
  onBack,
  onEdit,
  onDelete,
  onOpenStudyPdf,
  isDarkMode = false,
}) => {
  const d = isDarkMode;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto flex flex-col ${
        d ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Top Navbar */}
      <div
        className={`px-6 py-4 border-b sticky top-0 z-30 backdrop-blur-md flex items-center justify-between gap-4 ${
          d ? "border-slate-800 bg-slate-900/90" : "border-slate-200 bg-white/90 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-xl transition ${
              d
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="Back to Notes"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg font-bold line-clamp-1 ${d ? "text-white" : "text-slate-900"}`}>
                {note.title || "Untitled Note"}
              </h1>
              {project && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: d ? `${project.color}33` : `${project.color}1a`,
                    color: project.color,
                  }}
                >
                  {project.name}
                </span>
              )}
            </div>
            <p
              className={`text-xs flex items-center gap-1.5 mt-0.5 ${
                d ? "text-slate-400" : "text-slate-500"
              }`}
            >
              <Calendar size={12} />
              <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
              d
                ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-sm"
            }`}
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`p-2 rounded-xl transition ${
              d
                ? "text-slate-400 hover:text-red-400 hover:bg-slate-800"
                : "text-slate-400 hover:text-red-600 hover:bg-red-50"
            }`}
            title="Delete Note"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Reading View */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 space-y-8">
        {/* Content Body */}
        <div
          className={`prose max-w-none leading-relaxed text-sm sm:text-base font-sans break-words ${
            d ? "prose-invert text-slate-200" : "text-slate-800"
          }`}
          dangerouslySetInnerHTML={{
            __html: note.content || "<i class='opacity-60'>No content in this note.</i>",
          }}
        />

        {/* Attachments & PDFs */}
        {(note.attachments || []).length > 0 && (
          <div className={`pt-8 border-t space-y-4 ${d ? "border-slate-800" : "border-slate-200"}`}>
            <h3
              className={`text-xs font-bold uppercase tracking-wider ${
                d ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Attached Documents & Media ({note.attachments?.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {note.attachments?.map((att, idx) => {
                const isPdf =
                  att.type === "application/pdf" || att.path?.toLowerCase().endsWith(".pdf");

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      d ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          d ? "bg-slate-800 text-blue-400" : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {isPdf ? <BookOpen size={18} /> : <ImageIcon size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold truncate ${
                            d ? "text-slate-200" : "text-slate-900"
                          }`}
                        >
                          {att.filename || "Attachment"}
                        </p>
                        <p
                          className={`text-[10px] font-mono ${
                            d ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {isPdf ? "PDF Document" : "Media file"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPdf && onOpenStudyPdf ? (
                        <button
                          type="button"
                          onClick={() => onOpenStudyPdf(att.path, att.filename || "Document")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                        >
                          <BookOpen size={12} />
                          <span>Study Mode</span>
                        </button>
                      ) : (
                        <a
                          href={att.path}
                          target="_blank"
                          rel="noreferrer"
                          className={`p-1.5 rounded-lg transition ${
                            d
                              ? "text-slate-400 hover:text-white hover:bg-slate-800"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                          title="Open file in new tab"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteDetailView;
