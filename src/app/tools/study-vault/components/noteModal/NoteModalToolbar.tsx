"use client";

import React from "react";
import { COLORS, FONTS, SIZES } from "./NoteModalConstants";
import { IBtn, Icon, ICONS, Sep } from "./NoteModalIcons";
import NoteModalMathToolbar from "./NoteModalMathToolbar";

interface NoteModalToolbarProps {
  d: boolean;
  bg: string;
  border: string;
  text: string;
  muted: string;
  surface: string;
  selStyle: React.CSSProperties;
  activeFormats: Record<string, boolean>;
  exec: (cmd: string, val?: any) => void;
  fontFamily: string;
  applyFontFamily: (ff: string) => void;
  fontSize: string;
  applyFontSize: (sz: string) => void;
  colorPickerRef: React.RefObject<HTMLDivElement | null>;
  saveSelection: () => void;
  showColorPicker: boolean;
  setShowColorPicker: React.Dispatch<React.SetStateAction<boolean>>;
  restoreSelection: () => void;
  handleFileUpload: (files: File[]) => void;
  showMathBar: boolean;
  setShowMathBar: React.Dispatch<React.SetStateAction<boolean>>;
  setShowShortcutsModal: React.Dispatch<React.SetStateAction<boolean>>;
  insertMathSymbol: (sym: string) => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
}

export const NoteModalToolbar: React.FC<NoteModalToolbarProps> = ({
  d,
  bg,
  border,
  text,
  muted,
  surface,
  selStyle,
  activeFormats,
  exec,
  fontFamily,
  applyFontFamily,
  fontSize,
  applyFontSize,
  colorPickerRef,
  saveSelection,
  showColorPicker,
  setShowColorPicker,
  restoreSelection,
  handleFileUpload,
  showMathBar,
  setShowMathBar,
  setShowShortcutsModal,
  insertMathSymbol,
  editorRef,
}) => {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: bg,
        borderBottom: `1px solid ${border}`,
        padding: "0 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          padding: "6px 0",
          overflowX: "auto",
        }}
      >
        <IBtn iconKey="undo" title="Undo (Ctrl+Z)" onClick={() => exec("undo")} />
        <IBtn iconKey="redo" title="Redo (Ctrl+Y)" onClick={() => exec("redo")} />
        <Sep d={d} />

        <IBtn
          iconKey="bold"
          title="Bold (Ctrl+B)"
          active={activeFormats.bold}
          onClick={() => exec("bold")}
          color="#f59e0b"
        />
        <IBtn
          iconKey="italic"
          title="Italic (Ctrl+I)"
          active={activeFormats.italic}
          onClick={() => exec("italic")}
          color="#10b981"
        />
        <IBtn
          iconKey="underline"
          title="Underline (Ctrl+U)"
          active={activeFormats.underline}
          onClick={() => exec("underline")}
          color="#3b82f6"
        />
        <IBtn
          iconKey="strikethrough"
          title="Strikethrough (Ctrl+Shift+S)"
          active={activeFormats.strikethrough}
          onClick={() => exec("strikethrough")}
          color="#ef4444"
        />
        <Sep d={d} />

        <IBtn
          iconKey="h1"
          title="Heading 1 (Ctrl+Shift+1)"
          onClick={() => exec("formatBlock", "<h2>")}
          color="#8b5cf6"
        />
        <IBtn
          iconKey="h2"
          title="Heading 2 (Ctrl+Shift+2)"
          onClick={() => exec("formatBlock", "<h3>")}
          color="#6366f1"
        />
        <Sep d={d} />

        <IBtn
          iconKey="ul"
          title="Bullet list (Ctrl+Shift+L)"
          active={activeFormats.ul}
          onClick={() => exec("insertUnorderedList")}
          color="#22c55e"
        />
        <IBtn
          iconKey="ol"
          title="Numbered list (Ctrl+Shift+O)"
          active={activeFormats.ol}
          onClick={() => exec("insertOrderedList")}
          color="#f97316"
        />
        <IBtn
          iconKey="quote"
          title="Blockquote"
          onClick={() => exec("formatBlock", "<blockquote>")}
          color="#ec4899"
        />
        <IBtn
          iconKey="code"
          title="Inline code / block"
          onClick={() => exec("formatBlock", "<pre>")}
          color="#06b6d4"
        />
        <Sep d={d} />

        <select
          value={fontFamily}
          onChange={(e) => applyFontFamily(e.target.value)}
          style={{ ...selStyle, width: 85 }}
          title="Font family"
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          value={fontSize}
          onChange={(e) => applyFontSize(e.target.value)}
          style={{ ...selStyle, width: 54 }}
          title="Font size"
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}px
            </option>
          ))}
        </select>
        <Sep d={d} />

        <div style={{ position: "relative" }} ref={colorPickerRef}>
          <button
            type="button"
            title="Text colour"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setShowColorPicker((v) => !v);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "3px 8px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: showColorPicker ? "rgba(99,102,241,0.15)" : "transparent",
              color: text,
              fontSize: 13,
              fontWeight: 700,
              height: 28,
            }}
          >
            <span style={{ fontSize: 14 }}>A</span>
            <span
              style={{
                width: 14,
                height: 3,
                borderRadius: 2,
                background: "#3b82f6",
                display: "block",
              }}
            />
            <span style={{ fontSize: 9, color: muted }}>▾</span>
          </button>
          {showColorPicker && (
            <div
              style={{
                position: "absolute",
                top: 34,
                left: 0,
                zIndex: 50,
                padding: 10,
                borderRadius: 14,
                background: surface,
                border: `1px solid ${border}`,
                boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                display: "grid",
                gridTemplateColumns: "repeat(5,1fr)",
                gap: 7,
                width: 170,
              }}
            >
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    restoreSelection();
                    exec("foreColor", c);
                    setShowColorPicker(false);
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: c,
                    border: "2.5px solid rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                    transition: "transform 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  title={c}
                />
              ))}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  restoreSelection();
                  exec("foreColor", "inherit");
                  setShowColorPicker(false);
                }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#1a202c 50%,#ffffff 50%)",
                  border: "2.5px solid rgba(255,255,255,0.4)",
                  cursor: "pointer",
                }}
                title="Default"
              />
            </div>
          )}
        </div>
        <Sep d={d} />

        <label
          title="Insert image or PDF"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 6,
            cursor: "pointer",
            color: d ? "#94a3b8" : "#374151",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Icon d={ICONS.attach} size={15} title="Insert image or PDF" />
          <input
            type="file"
            accept="image/*,.pdf"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files) {
                handleFileUpload(Array.from(e.target.files));
              }
            }}
          />
        </label>

        <button
          type="button"
          title="Math equation toolbar"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowMathBar((v) => !v);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 9px",
            height: 28,
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            background: showMathBar
              ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
              : d
              ? "rgba(99,102,241,0.15)"
              : "rgba(99,102,241,0.1)",
            color: showMathBar ? "#fff" : d ? "#a5b4fc" : "#4f46e5",
            transition: "all 0.15s",
          }}
        >
          <Icon
            d={ICONS.math}
            size={13}
            color={showMathBar ? "#fff" : d ? "#a5b4fc" : "#4f46e5"}
          />
          ∑ Math
        </button>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          title="Keyboard shortcuts"
          onClick={() => setShowShortcutsModal(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            background: "transparent",
            color: muted,
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Icon d={ICONS.info} size={15} title="Shortcuts" />
        </button>
      </div>

      <NoteModalMathToolbar
        showMathBar={showMathBar}
        border={border}
        muted={muted}
        surface={surface}
        d={d}
        insertMathSymbol={insertMathSymbol}
        restoreSelection={restoreSelection}
        editorRef={editorRef}
      />
    </div>
  );
};

export default NoteModalToolbar;
