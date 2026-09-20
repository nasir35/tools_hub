"use client";

import React from "react";

interface NoteModalEditorProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  updateFormats: () => void;
  handlePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  setIsDragging: (val: boolean) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging: boolean;
  border: string;
  text: string;
  editorBg: string;
  selectedImage: HTMLImageElement | null;
  deleteIconPos: { top: number; left: number };
  removeImage: (img: HTMLImageElement) => void;
}

export const NoteModalEditor: React.FC<NoteModalEditorProps> = ({
  editorRef,
  handleKeyDown,
  updateFormats,
  handlePaste,
  setIsDragging,
  handleDrop,
  isDragging,
  border,
  text,
  editorBg,
  selectedImage,
  deleteIconPos,
  removeImage,
}) => {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        position: "relative",
      }}
    >
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onKeyUp={updateFormats}
        onMouseUp={updateFormats}
        onPaste={handlePaste}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        data-placeholder="Write your note… drag & drop images, paste screenshots, or click ∑ Math for equations."
        style={{
          flex: 1,
          minHeight: "100%",
          padding: 16,
          borderRadius: 12,
          outline: "none",
          lineHeight: 1.8,
          wordBreak: "break-word",
          color: text,
          background: editorBg,
          border: isDragging ? "2px solid #6366f1" : `2px solid ${border}`,
          transition: "border-color 0.2s",
          fontSize: 14,
          position: "relative",
          overflow: "auto",
        }}
      />
      {selectedImage && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            removeImage(selectedImage);
          }}
          style={{
            position: "absolute",
            top: deleteIconPos.top,
            left: deleteIconPos.left,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#ef4444",
            border: "none",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: "bold",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            zIndex: 25,
            pointerEvents: "auto",
          }}
          title="Remove image"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default NoteModalEditor;
