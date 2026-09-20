"use client";

import React, { useMemo } from "react";
import { getAttachmentUrl } from "../utils/attachmentPaths";
import { NoteEntry, ProjectEntry } from "../utils/types";

function formatSize(bytes?: number) {
  if (!bytes || bytes === 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function estimateNoteSize(note: NoteEntry) {
  const contentBytes = new TextEncoder().encode(note.content || "").length;
  const titleBytes = new TextEncoder().encode(note.title || "").length;
  const attBytes = (note.attachments || []).reduce((sum, a) => sum + (a.size || 0), 0);
  return contentBytes + titleBytes + attBytes;
}

function countAttachments(note: NoteEntry) {
  const unique = new Map();
  for (const att of note.attachments || []) {
    unique.set(att.path || att.url || att.name, att);
  }
  const atts = Array.from(unique.values());
  return {
    images: atts.filter((a) => a.type?.startsWith("image/")).length,
    pdfs: atts.filter((a) => a.type === "application/pdf" || a.name?.endsWith(".pdf")).length,
  };
}

const AttBadge: React.FC<{ icon: string; count: number; color: string; bg: string }> = ({
  icon,
  count,
  color,
  bg,
}) => {
  if (!count) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: bg,
        color: color,
        lineHeight: 1,
      }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      {count}
    </span>
  );
};

const SizeBadge: React.FC<{ size: { label: string | null; _raw: number }; isDarkMode: boolean }> = ({
  size,
  isDarkMode,
}) => {
  if (!size?.label) return null;
  const d = isDarkMode;
  const bytes = size._raw;
  const col =
    bytes < 50 * 1024
      ? { bg: d ? "rgba(34,197,94,0.15)" : "#dcfce7", fg: d ? "#4ade80" : "#166534" }
      : bytes < 500 * 1024
      ? { bg: d ? "rgba(234,179,8,0.15)" : "#fef9c3", fg: d ? "#facc15" : "#854d0e" }
      : bytes < 5 * 1024 * 1024
      ? { bg: d ? "rgba(249,115,22,0.15)" : "#ffedd5", fg: d ? "#fb923c" : "#9a3412" }
      : { bg: d ? "rgba(239,68,68,0.15)" : "#fee2e2", fg: d ? "#f87171" : "#991b1b" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 7px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 600,
        background: col.bg,
        color: col.fg,
        lineHeight: 1,
      }}
    >
      <svg
        width={9}
        height={9}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
      {size.label}
    </span>
  );
};

interface NoteCardProps {
  note: NoteEntry;
  project?: ProjectEntry | null;
  viewMode?: "large" | "medium" | "list" | string;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
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
  const date = new Date(note.updatedAt);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const { images: imgCount, pdfs: pdfCount } = useMemo(() => countAttachments(note), [note]);

  const sizeInfo = useMemo(() => {
    const raw = estimateNoteSize(note);
    return { label: formatSize(raw), _raw: raw };
  }, [note]);

  const thumbnailSrc = useMemo(() => {
    if ((note as any).thumbnail) return (note as any).thumbnail;
    if (note.content) {
      const match = note.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match) return match[1];
    }
    const firstImg = (note.attachments || []).find((a) => a.type?.startsWith("image/"));
    if (firstImg) return getAttachmentUrl(firstImg);
    return null;
  }, [note]);

  const cardBg = d ? "#0f172a" : "#ffffff";
  const cardBorder = d ? "#1e293b" : "#e2e8f0";
  const titleColor = d ? "#e6edf3" : "#0f172a";
  const metaColor = d ? "#8b949e" : "#94a3b8";
  const snippetColor = d ? "#6e7681" : "#64748b";

  const snippet = useMemo(() => {
    if (!note.content) return "";
    return note.content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140);
  }, [note.content]);

  // ── LIST MODE ─────────────────────────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <div
        onClick={onClick}
        className="group"
        style={{
          width: "100%",
          textAlign: "left",
          padding: "10px 14px",
          borderRadius: 12,
          border: `1px solid ${cardBorder}`,
          background: cardBg,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
          transition: "box-shadow 0.15s, border-color 0.15s",
        }}
      >
        {thumbnailSrc && (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              overflow: "hidden",
              flexShrink: 0,
              border: `1px solid ${cardBorder}`,
            }}
          >
            <img
              src={thumbnailSrc}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: titleColor,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginBottom: 2,
            }}
          >
            {note.title || "Untitled Note"}
          </p>
          <p style={{ fontSize: 11, color: metaColor }}>
            {dateStr} · {timeStr}
            {project?.name && ` · 📁 ${project.name}`}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <AttBadge
            icon="🖼️"
            count={imgCount}
            color={d ? "#60a5fa" : "#1d4ed8"}
            bg={d ? "rgba(59,130,246,0.15)" : "#dbeafe"}
          />
          <AttBadge
            icon="📄"
            count={pdfCount}
            color={d ? "#f87171" : "#991b1b"}
            bg={d ? "rgba(239,68,68,0.15)" : "#fee2e2"}
          />
          <SizeBadge size={sizeInfo} isDarkMode={d} />
        </div>
      </div>
    );
  }

  // ── GRID MODES (large / medium) ──────────────────────────────────────────
  const imgHeight = viewMode === "large" ? 160 : 110;

  return (
    <div
      onClick={onClick}
      className="group"
      style={{
        textAlign: "left",
        borderRadius: 14,
        border: `1px solid ${cardBorder}`,
        background: cardBg,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        transition: "box-shadow 0.18s, transform 0.15s, border-color 0.15s",
        boxShadow: d ? "0 1px 6px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.06)",
        position: "relative",
      }}
    >
      {/* Top thumbnail */}
      {thumbnailSrc ? (
        <div
          style={{
            width: "100%",
            height: imgHeight,
            overflow: "hidden",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <img
            src={thumbnailSrc}
            alt="preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s",
            }}
            onError={(e) => {
              const p = (e.currentTarget as HTMLElement).parentElement;
              if (p) p.style.display = "none";
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 36,
              background: `linear-gradient(to bottom, transparent, ${cardBg})`,
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: imgHeight,
            flexShrink: 0,
            background: d
              ? "linear-gradient(135deg, #1e1b4b 0%, #1e3a5f 100%)"
              : "linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: d ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)",
            }}
          />
          <span style={{ fontSize: viewMode === "large" ? 38 : 26, opacity: 0.6 }}>📝</span>
        </div>
      )}

      {/* Card body */}
      <div
        style={{
          padding: "12px 14px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <p
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: titleColor,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {note.title || "Untitled Note"}
        </p>

        {snippet && (
          <p
            style={{
              fontSize: 12,
              color: snippetColor,
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: viewMode === "large" ? 3 : 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {snippet}
          </p>
        )}

        {/* Card footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 4,
            marginTop: "auto",
            paddingTop: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <AttBadge
              icon="🖼️"
              count={imgCount}
              color={d ? "#60a5fa" : "#1d4ed8"}
              bg={d ? "rgba(59,130,246,0.15)" : "#dbeafe"}
            />
            <AttBadge
              icon="📄"
              count={pdfCount}
              color={d ? "#f87171" : "#991b1b"}
              bg={d ? "rgba(239,68,68,0.15)" : "#fee2e2"}
            />
            <SizeBadge size={sizeInfo} isDarkMode={d} />
          </div>

          <p style={{ fontSize: 10, color: metaColor }}>
            {dateStr}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
