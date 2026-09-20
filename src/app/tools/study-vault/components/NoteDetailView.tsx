"use client";

import React, { useState } from "react";
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
import { getAttachmentUrl } from "../utils/attachmentPaths";

interface NoteDetailViewProps {
  note: NoteEntry;
  project?: ProjectEntry | null;
  projects?: ProjectEntry[];
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
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [pdfInline, setPdfInline] = useState<string | null>(null);

  const date = new Date(note.updatedAt);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        overflowY: "auto",
        background: d ? "#020617" : "#f8fafc",
        color: d ? "#f1f5f9" : "#0f172a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          borderBottom: d ? "1px solid #1e293b" : "1px solid #e2e8f0",
          background: d ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          padding: "10px 18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <button
              onClick={onBack}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                background: d ? "#1e293b" : "#f1f5f9",
                color: d ? "#94a3b8" : "#475569",
              }}
            >
              ← Back
            </button>
            <span style={{ color: d ? "#475569" : "#9ca3af", fontSize: 13 }}>/</span>
            <span
              style={{
                color: d ? "#64748b" : "#64748b",
                fontSize: 13,
                maxWidth: 120,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {project?.name || "All Notes"}
            </span>
            <span style={{ color: d ? "#475569" : "#9ca3af", fontSize: 13 }}>/</span>
            <span
              style={{
                color: d ? "#cbd5e1" : "#334155",
                fontSize: 13,
                fontWeight: 600,
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {note.title}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onEdit}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: "#3b82f6",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
              title="Edit Note"
            >
              <span>✏️</span>
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              style={{
                padding: "7px 10px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: d ? "rgba(239,68,68,0.15)" : "#fee2e2",
                color: "#ef4444",
              }}
              title="Delete Note"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* Note Content Section */}
      <div style={{ maxWidth: 840, width: "100%", margin: "0 auto", padding: "28px 18px", flex: 1 }}>
        <h1
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
            fontWeight: 800,
            marginBottom: 8,
            color: d ? "#f1f5f9" : "#0f172a",
            lineHeight: 1.25,
          }}
        >
          {note.title || "Untitled Note"}
        </h1>

        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 24,
            fontSize: 13,
            color: d ? "#64748b" : "#94a3b8",
            flexWrap: "wrap",
          }}
        >
          <span>📅 {dateStr}</span>
          <span>🕐 {timeStr}</span>
          {project?.name && <span>📁 {project.name}</span>}
        </div>

        {/* Note Body */}
        <div
          style={{
            borderRadius: 16,
            padding: "24px 28px",
            background: d ? "#0f172a" : "#ffffff",
            border: d ? "1px solid #1e293b" : "1px solid #e2e8f0",
            boxShadow: d ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.05)",
            lineHeight: 1.8,
            fontSize: 15,
            wordBreak: "break-word",
          }}
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html: note.content || "<p style='color:#94a3b8;font-style:italic;'>No content.</p>",
          }}
        />

        {/* Attached Files & PDFs */}
        {(note.attachments || []).length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: d ? "#94a3b8" : "#64748b",
                marginBottom: 12,
              }}
            >
              ATTACHED DOCUMENTS & MEDIA ({note.attachments?.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {note.attachments?.map((att, idx) => {
                const isPdf =
                  att.type === "application/pdf" || att.name?.toLowerCase().endsWith(".pdf");
                const url = getAttachmentUrl(att);
                const isOpen = pdfInline === url;

                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 16px",
                        borderRadius: 12,
                        background: d ? "#0f172a" : "#ffffff",
                        border: d ? "1px solid #1e293b" : "1px solid #e2e8f0",
                      }}
                    >
                      <span style={{ fontSize: "1.4rem" }}>{isPdf ? "📄" : "🖼️"}</span>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {att.name}
                      </span>

                      {isPdf ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setPdfInline(isOpen ? null : url)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 8,
                              border: "none",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              background: d ? "#1e293b" : "#f1f5f9",
                              color: d ? "#e2e8f0" : "#334155",
                            }}
                          >
                            {isOpen ? "✕ Close" : "📖 Preview"}
                          </button>
                          {onOpenStudyPdf && (
                            <button
                              type="button"
                              onClick={() => onOpenStudyPdf(url, att.name || att.filename || "Document")}
                              style={{
                                padding: "5px 12px",
                                borderRadius: 8,
                                border: "none",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                                background: "#3b82f6",
                                color: "#fff",
                              }}
                            >
                              🎓 Study
                            </button>
                          )}
                        </div>
                      ) : (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "5px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            background: d ? "#1e293b" : "#f1f5f9",
                            color: "#3b82f6",
                            textDecoration: "none",
                          }}
                        >
                          View Image ↗
                        </a>
                      )}
                    </div>

                    {isOpen && isPdf && (
                      <iframe
                        src={url}
                        style={{
                          width: "100%",
                          height: "65vh",
                          borderRadius: 12,
                          border: d ? "1px solid #1e293b" : "1px solid #cbd5e1",
                        }}
                        title={att.name}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 16,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              borderRadius: 20,
              padding: 24,
              maxWidth: 360,
              width: "100%",
              background: d ? "#0f172a" : "#fff",
              border: d ? "1px solid #1e293b" : "1px solid #e2e8f0",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
          >
            <p
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: 6,
                color: d ? "#f1f5f9" : "#0f172a",
              }}
            >
              Delete this note?
            </p>
            <p style={{ fontSize: 13, marginBottom: 20, color: d ? "#94a3b8" : "#64748b" }}>
              This will permanently delete this note and cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 10,
                  border: `1px solid ${d ? "#334155" : "#e2e8f0"}`,
                  cursor: "pointer",
                  background: d ? "#1e293b" : "#f1f5f9",
                  color: d ? "#94a3b8" : "#334155",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirm(false);
                  onDelete();
                }}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  background: "#ef4444",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteDetailView;
