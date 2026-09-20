"use client";

import React from "react";

interface NoteModalFooterProps {
  onClose: () => void;
  handleSave: () => void;
  border: string;
  bg: string;
  muted: string;
  surface: string;
  existingNote?: any;
}

export const NoteModalFooter: React.FC<NoteModalFooterProps> = ({
  onClose,
  handleSave,
  border,
  bg,
  muted,
  surface,
  existingNote,
}) => {
  return (
    <div
      style={{
        borderTop: `1px solid ${border}`,
        padding: "11px 18px",
        display: "flex",
        gap: 10,
        background: bg,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        style={{
          flex: 1,
          padding: "9px 0",
          borderRadius: 10,
          border: `1px solid ${border}`,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
          background: "transparent",
          color: muted,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = surface)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        style={{
          flex: 2,
          padding: "9px 0",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 14,
          background: "linear-gradient(135deg,#3b82f6,#6366f1)",
          color: "#fff",
          boxShadow: "0 2px 12px rgba(99,102,241,0.35)",
          transition: "opacity 0.15s,transform 0.1s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        {existingNote ? "💾 Update Note" : "💾 Save Note"}
      </button>
    </div>
  );
};

export default NoteModalFooter;
