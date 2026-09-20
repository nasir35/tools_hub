"use client";

import React from "react";
import { MATH_SYMS } from "./NoteModalConstants";

interface NoteModalMathToolbarProps {
  showMathBar: boolean;
  border: string;
  muted: string;
  surface: string;
  d: boolean;
  insertMathSymbol: (sym: string) => void;
  restoreSelection: () => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
}

export const NoteModalMathToolbar: React.FC<NoteModalMathToolbarProps> = ({
  showMathBar,
  border,
  muted,
  surface,
  d,
  insertMathSymbol,
  restoreSelection,
  editorRef,
}) => {
  if (!showMathBar) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 3,
        padding: "6px 0 8px",
        borderTop: `1px dashed ${border}`,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: muted,
          alignSelf: "center",
          marginRight: 4,
          letterSpacing: "0.05em",
        }}
      >
        SYMBOLS:
      </span>
      {MATH_SYMS.map(({ label, ins }) => (
        <button
          key={ins}
          type="button"
          title={ins}
          onMouseDown={(e) => {
            e.preventDefault();
            insertMathSymbol(ins);
          }}
          style={{
            minWidth: 28,
            height: 26,
            padding: "0 5px",
            borderRadius: 5,
            border: `1px solid ${border}`,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            background: surface,
            color: d ? "#c9d1d9" : "#1a202c",
            fontFamily: "'Times New Roman', serif",
            transition: "background 0.1s,transform 0.1s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = d ? "#21262d" : "#e0e7ff";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = surface;
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {label}
        </button>
      ))}
      <button
        type="button"
        title="Insert inline equation block"
        onMouseDown={(e) => {
          e.preventDefault();
          restoreSelection();
          editorRef.current?.focus();
          const eq = document.createElement("span");
          eq.contentEditable = "true";
          eq.style.cssText = `display:inline-block;padding:2px 10px;margin:0 3px;border-radius:6px;background:${
            d ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)"
          };border:1px solid ${
            d ? "#4f46e5" : "#c7d2fe"
          };font-family:'Times New Roman',serif;font-size:1.05em;color:${
            d ? "#a5b4fc" : "#4338ca"
          }`;
          eq.textContent = "f(x) = ";
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const r = sel.getRangeAt(0);
            r.deleteContents();
            r.insertNode(eq);
            r.setStartAfter(eq);
            r.setEndAfter(eq);
            sel.removeAllRanges();
            sel.addRange(r);
          } else {
            editorRef.current?.appendChild(eq);
          }
        }}
        style={{
          padding: "3px 10px",
          height: 26,
          borderRadius: 5,
          border: `1px solid ${d ? "#4f46e5" : "#c7d2fe"}`,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          background: d ? "rgba(99,102,241,0.25)" : "#e0e7ff",
          color: d ? "#a5b4fc" : "#4338ca",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontFamily: "'Times New Roman', serif",
        }}
      >
        <span>f(x)</span> block
      </button>
    </div>
  );
};

export default NoteModalMathToolbar;
