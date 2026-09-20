"use client";

import React from "react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const SHORTCUTS = [
  { label: "Bold", keys: ["Ctrl", "B"] },
  { label: "Italic", keys: ["Ctrl", "I"] },
  { label: "Underline", keys: ["Ctrl", "U"] },
  { label: "Undo", keys: ["Ctrl", "Z"] },
  { label: "Redo", keys: ["Ctrl", "Y"] },
  { label: "Bullet List", keys: ["Ctrl", "Shift", "L"] },
  { label: "Numbered List", keys: ["Ctrl", "Shift", "O"] },
  { label: "Heading 1", keys: ["Ctrl", "Shift", "1"] },
  { label: "Heading 2", keys: ["Ctrl", "Shift", "2"] },
  { label: "Strikethrough", keys: ["Ctrl", "Shift", "S"] },
  { label: "Save Note", keys: ["Ctrl", "S"] },
  { label: "Math Toolbar", keys: ["Ctrl", "M"] },
  { label: "Close Modal", keys: ["Esc"] },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const bg = isDarkMode ? "#0d1117" : "#ffffff";
  const surface = isDarkMode ? "#161b22" : "#f8fafc";
  const border = isDarkMode ? "#30363d" : "#e2e8f0";
  const text = isDarkMode ? "#e6edf3" : "#1a202c";
  const muted = isDarkMode ? "#8b949e" : "#64748b";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: bg,
          borderRadius: "20px",
          width: "90%",
          maxWidth: 480,
          border: `1px solid ${border}`,
          boxShadow: "0 20px 35px -10px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: text }}>
            ⌨️ Keyboard Shortcuts
          </span>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: `1px solid ${border}`,
              background: "transparent",
              cursor: "pointer",
              color: muted,
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "20px", maxHeight: "60vh", overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SHORTCUTS.map((sc, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 13,
                  color: text,
                  padding: "6px 0",
                  borderBottom:
                    idx < SHORTCUTS.length - 1 ? `1px solid ${border}` : "none",
                }}
              >
                <span>{sc.label}</span>
                <div style={{ display: "flex", gap: 5 }}>
                  {sc.keys.map((k, kIdx) => (
                    <kbd
                      key={kIdx}
                      style={{
                        padding: "3px 8px",
                        fontSize: 11,
                        borderRadius: 6,
                        border: `1px solid ${border}`,
                        background: surface,
                        color: text,
                        fontFamily: "monospace",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
