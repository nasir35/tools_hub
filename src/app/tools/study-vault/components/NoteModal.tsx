"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { NoteEntry, ProjectEntry, AttachmentItem } from "../utils/types";
import { getAttachmentPath, getAttachmentUrl } from "../utils/attachmentPaths";
import NoteModalToolbar from "./noteModal/NoteModalToolbar";
import NoteModalEditor from "./noteModal/NoteModalEditor";
import NoteModalFooter from "./noteModal/NoteModalFooter";
import {
  buildAttachmentFolder,
  collectAttachmentsFromContent,
} from "./noteModal/noteModalUtils";
import { ShortcutsModal } from "./ShortcutsModal";
import { AttachmentPreview } from "./AttachmentPreview";

interface NoteModalProps {
  onClose: () => void;
  onSave: (noteData: {
    title: string;
    content: string;
    projectId?: string | null;
    attachments: AttachmentItem[];
    attachmentFolder?: string;
  }) => Promise<void>;
  existingNote?: NoteEntry | null;
  defaultProjectId?: string | null;
  allProjects: ProjectEntry[];
  isDarkMode?: boolean;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  onClose,
  onSave,
  existingNote,
  defaultProjectId,
  allProjects,
  isDarkMode = false,
}) => {
  const d = isDarkMode;
  const [title, setTitle] = useState(existingNote?.title || "");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    existingNote?.projectId || defaultProjectId || null
  );
  const [noteAttachments, setNoteAttachments] = useState<AttachmentItem[]>(
    existingNote?.attachments || []
  );
  const [attachmentFolder, setAttachmentFolder] = useState<string>(
    (existingNote as any)?.attachmentFolder || ""
  );

  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMathBar, setShowMathBar] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [fontSize, setFontSize] = useState("14");
  const [fontFamily, setFontFamily] = useState("");
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [deleteIconPos, setDeleteIconPos] = useState({ top: 0, left: 0 });
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);

  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.title);
      setSelectedProjectId(existingNote.projectId || defaultProjectId || null);
      setNoteAttachments(existingNote.attachments || []);
      setAttachmentFolder((existingNote as any).attachmentFolder || "");
      if (editorRef.current) {
        editorRef.current.innerHTML = existingNote.content || "";
      }
    } else {
      setTitle("");
      setSelectedProjectId(defaultProjectId || null);
      setNoteAttachments([]);
      setAttachmentFolder("");
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }
  }, [existingNote, defaultProjectId]);

  const saveSelection = () => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const updateFormats = useCallback(() => {
    saveSelection();
    try {
      if (typeof document === "undefined") return;
      const sel = window.getSelection();
      const li =
        sel?.anchorNode?.nodeType === Node.ELEMENT_NODE
          ? (sel.anchorNode as HTMLElement).closest("li")
          : sel?.anchorNode?.parentElement?.closest("li");
      const currentList = li?.closest("ul, ol");
      const isUl = currentList?.tagName === "UL";
      const isOl = currentList?.tagName === "OL";

      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikethrough: document.queryCommandState("strikethrough"),
        ul: isUl || document.queryCommandState("insertUnorderedList"),
        ol: isOl || document.queryCommandState("insertOrderedList"),
      });
    } catch {}
  }, []);

  // Nested list indentation and outdenting logic
  const indentListItem = useCallback((li: HTMLElement, sel: Selection) => {
    const prevLi = li.previousElementSibling as HTMLElement | null;
    if (!prevLi) return;

    let sublist = Array.from(prevLi.children).find(
      (c) => c.tagName === "UL" || c.tagName === "OL"
    ) as HTMLElement | undefined;

    if (!sublist) {
      const parentList = li.closest("ul, ol");
      const listTag = parentList ? parentList.tagName.toLowerCase() : "ul";
      sublist = document.createElement(listTag);
      prevLi.appendChild(sublist);
    }

    sublist.appendChild(li);

    const newRange = document.createRange();
    newRange.selectNodeContents(li);
    newRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }, []);

  const convertListItemToBlock = useCallback((li: HTMLElement, sel: Selection) => {
    const list = li.closest("ul, ol");
    const newBlock = document.createElement("p");

    if (!li.childNodes.length || (li.childNodes.length === 1 && li.firstChild?.nodeName === "BR")) {
      newBlock.innerHTML = "<br>";
    } else {
      while (li.firstChild) {
        newBlock.appendChild(li.firstChild);
      }
    }

    if (list) {
      const lisAfter: Element[] = [];
      let next = li.nextElementSibling;
      while (next) {
        lisAfter.push(next);
        next = next.nextElementSibling;
      }

      const listParent = list.parentNode;
      const listNextSibling = list.nextSibling;
      li.remove();

      if (lisAfter.length > 0) {
        const continuationList = document.createElement(list.tagName.toLowerCase());
        lisAfter.forEach((item) => continuationList.appendChild(item));
        listParent?.insertBefore(newBlock, listNextSibling);
        listParent?.insertBefore(continuationList, newBlock.nextSibling);
      } else {
        if (listNextSibling) {
          listParent?.insertBefore(newBlock, listNextSibling);
        } else {
          listParent?.appendChild(newBlock);
        }
      }

      if (!list.children.length) {
        list.remove();
      }
    } else {
      li.replaceWith(newBlock);
    }

    const newRange = document.createRange();
    newRange.setStart(newBlock, 0);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }, []);

  const outdentListItem = useCallback(
    (li: HTMLElement, sel: Selection) => {
      const currentList = li.closest("ul, ol");
      if (!currentList) return;

      const parentLi = currentList.parentElement?.closest("li");
      if (parentLi) {
        const grandParentList = parentLi.closest("ul, ol");
        if (grandParentList) {
          const siblingsAfter: Element[] = [];
          let next = li.nextElementSibling;
          while (next) {
            siblingsAfter.push(next);
            next = next.nextElementSibling;
          }

          grandParentList.insertBefore(li, parentLi.nextSibling);

          if (siblingsAfter.length > 0) {
            const newSublist = document.createElement(currentList.tagName.toLowerCase());
            siblingsAfter.forEach((s) => newSublist.appendChild(s));
            li.appendChild(newSublist);
          }

          if (!currentList.children.length) {
            currentList.remove();
          }

          const newRange = document.createRange();
          newRange.selectNodeContents(li);
          newRange.collapse(false);
          sel.removeAllRanges();
          sel.addRange(newRange);
          return;
        }
      }

      convertListItemToBlock(li, sel);
    },
    [convertListItemToBlock]
  );

  const toggleList = useCallback(
    (type: "ul" | "ol") => {
      editorRef.current?.focus();
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) {
        document.execCommand(type === "ul" ? "insertUnorderedList" : "insertOrderedList", false);
        updateFormats();
        return;
      }

      const range = sel.getRangeAt(0);
      const li =
        range.startContainer.nodeType === Node.ELEMENT_NODE
          ? (range.startContainer as HTMLElement).closest("li")
          : range.startContainer.parentElement?.closest("li");

      if (!li || !editorRef.current?.contains(li)) {
        document.execCommand(type === "ul" ? "insertUnorderedList" : "insertOrderedList", false);
        updateFormats();
        return;
      }

      const currentList = li.closest("ul, ol");
      const currentType = currentList?.tagName.toLowerCase();

      if (currentType === type) {
        outdentListItem(li, sel);
      } else {
        const parentLi = currentList?.parentElement?.closest("li");
        if (parentLi && currentList) {
          if (currentList.children.length === 1) {
            const newList = document.createElement(type);
            while (currentList.firstChild) {
              newList.appendChild(currentList.firstChild);
            }
            currentList.replaceWith(newList);
          } else {
            const newList = document.createElement(type);
            currentList.parentNode?.insertBefore(newList, currentList.nextSibling);
            newList.appendChild(li);
          }
        } else {
          const prevLi = li.previousElementSibling as HTMLElement | null;
          if (prevLi) {
            let sublist = Array.from(prevLi.children).find(
              (c) => c.tagName === "UL" || c.tagName === "OL"
            ) as HTMLElement | undefined;
            if (!sublist || sublist.tagName.toLowerCase() !== type) {
              sublist = document.createElement(type);
              prevLi.appendChild(sublist);
            }
            sublist.appendChild(li);
          } else {
            document.execCommand(
              type === "ul" ? "insertUnorderedList" : "insertOrderedList",
              false
            );
          }
        }
      }

      updateFormats();
    },
    [outdentListItem, updateFormats]
  );

  const exec = useCallback(
    (cmd: string, val: any = null) => {
      editorRef.current?.focus();

      if (cmd === "insertUnorderedList") {
        toggleList("ul");
        return;
      }
      if (cmd === "insertOrderedList") {
        toggleList("ol");
        return;
      }

      document.execCommand(cmd, false, val);
      updateFormats();
    },
    [toggleList, updateFormats]
  );

  const handleEditorKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // 1. Enter on empty list item -> Outdent or exit list
      if (e.key === "Enter" && !e.shiftKey) {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        const li =
          range.startContainer.nodeType === Node.ELEMENT_NODE
            ? (range.startContainer as HTMLElement).closest("li")
            : range.startContainer.parentElement?.closest("li");

        if (li && editorRef.current?.contains(li)) {
          const text = li.textContent?.replace(/[\u200B\u00A0\s]/g, "");
          const hasMedia = li.querySelector("img, svg, iframe, math");

          if (!text && !hasMedia) {
            e.preventDefault();
            outdentListItem(li, sel);
            updateFormats();
            return;
          }
        }
      }

      // 2. Backspace at start of list item -> Outdent or exit list
      if (e.key === "Backspace") {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !sel.isCollapsed) return;
        const range = sel.getRangeAt(0);
        const li =
          range.startContainer.nodeType === Node.ELEMENT_NODE
            ? (range.startContainer as HTMLElement).closest("li")
            : range.startContainer.parentElement?.closest("li");

        if (li && editorRef.current?.contains(li)) {
          let isAtStart = false;
          if (range.startContainer === li && range.startOffset === 0) {
            isAtStart = true;
          } else if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
            let prev = range.startContainer.previousSibling;
            let hasTextBefore = false;
            while (prev) {
              if (prev.textContent && prev.textContent.trim().length > 0) {
                hasTextBefore = true;
                break;
              }
              prev = prev.previousSibling;
            }
            if (!hasTextBefore) isAtStart = true;
          }

          if (isAtStart) {
            e.preventDefault();
            outdentListItem(li, sel);
            updateFormats();
            return;
          }
        }
      }

      // 3. Tab and Shift+Tab inside lists
      if (e.key === "Tab") {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);

        const li =
          range.startContainer.nodeType === Node.ELEMENT_NODE
            ? (range.startContainer as HTMLElement).closest("li")
            : range.startContainer.parentElement?.closest("li");

        if (li && editorRef.current?.contains(li)) {
          e.preventDefault();
          if (e.shiftKey) {
            outdentListItem(li, sel);
          } else {
            indentListItem(li, sel);
          }
          updateFormats();
          return;
        }
      }

      // 4. Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    },
    [indentListItem, outdentListItem, updateFormats]
  );

  const applyFontSize = (sz: string) => {
    setFontSize(sz);
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand("fontSize", false, "7");
    const spans = editorRef.current?.querySelectorAll('font[size="7"]');
    spans?.forEach((s) => {
      s.removeAttribute("size");
      (s as HTMLElement).style.fontSize = `${sz}px`;
    });
  };

  const applyFontFamily = (ff: string) => {
    setFontFamily(ff);
    restoreSelection();
    editorRef.current?.focus();
    if (ff) document.execCommand("fontName", false, ff);
  };

  const insertMathSymbol = (sym: string) => {
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand("insertText", false, sym);
    updateFormats();
  };

  const insertImageAtCursor = useCallback((url: string, alt: string = "image") => {
    editorRef.current?.focus();
    const img = document.createElement("img");
    img.src = url;
    img.alt = alt;
    img.style.cssText =
      "max-width:100%;border-radius:10px;margin:10px 0;display:block;cursor:pointer;";
    img.contentEditable = "false";

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.setEndAfter(img);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editorRef.current?.appendChild(img);
    }
    return img;
  }, []);

  const insertPdfAtCursor = useCallback((att: AttachmentItem, fileName: string) => {
    editorRef.current?.focus();
    const block = document.createElement("div");
    block.contentEditable = "false";
    block.setAttribute("data-pdf", getAttachmentPath(att));
    block.setAttribute("data-name", fileName);
    block.style.cssText =
      "display:flex;align-items:center;gap:10px;padding:10px 14px;margin:8px 0;border-radius:10px;background:rgba(59,130,246,0.12);border:1.5px solid #3b82f6;cursor:pointer;";
    block.innerHTML = `<span style="font-size:1.5rem">📄</span><span style="font-weight:600;font-size:0.88rem">${fileName}</span>`;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(block);
      range.setStartAfter(block);
      range.setEndAfter(block);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editorRef.current?.appendChild(block);
    }
  }, []);

  // Upload handler for attachments
  const handleFileUpload = async (files: File[]) => {
    if (!files.length) return;
    const toastId = toast.loading("Uploading attachment…");

    let currentFolder = attachmentFolder;
    if (!currentFolder && title.trim()) {
      currentFolder = buildAttachmentFolder(title);
      setAttachmentFolder(currentFolder);
    }

    try {
      for (const file of files) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch("/tools/study-vault/api/attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64,
            filename: file.name,
            type: file.type,
            folder: currentFolder || undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }

        const data = await res.json();
        const newAttachment: AttachmentItem = {
          name: file.name,
          url: data.path,
          type: file.type,
          size: file.size,
          path: data.path,
          publicId: data.publicId,
        };

        setNoteAttachments((prev) => [...prev, newAttachment]);

        if (file.type.startsWith("image/")) {
          insertImageAtCursor(data.path, file.name);
        } else if (file.type === "application/pdf") {
          insertPdfAtCursor(newAttachment, file.name);
        }
      }
      toast.success("Attachment added!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload", { id: toastId });
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter((item) => item.type.startsWith("image/"));
    if (imageItems.length > 0) {
      e.preventDefault();
      const files = imageItems.map((item) => item.getAsFile()).filter(Boolean) as File[];
      handleFileUpload(files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  // Image selection overlay logic
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" && editor.contains(target)) {
        const img = target as HTMLImageElement;
        setSelectedImage(img);
        const imgRect = img.getBoundingClientRect();
        const editorRect = editor.getBoundingClientRect();
        setDeleteIconPos({
          top: imgRect.top - editorRect.top + editor.scrollTop - 8,
          left: imgRect.right - editorRect.left + editor.scrollLeft - 14,
        });
      } else {
        setSelectedImage(null);
      }
    };

    editor.addEventListener("click", handleClick);
    return () => editor.removeEventListener("click", handleClick);
  }, []);

  const removeImage = (img: HTMLImageElement) => {
    img.remove();
    setSelectedImage(null);
    updateFormats();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a note title");
      return;
    }

    setSaving(true);
    try {
      const rawContent = editorRef.current?.innerHTML || "";
      const finalAttachments = collectAttachmentsFromContent(
        rawContent,
        noteAttachments,
        attachmentFolder
      );

      await onSave({
        title: title.trim(),
        content: rawContent,
        projectId: selectedProjectId,
        attachments: finalAttachments,
        attachmentFolder,
      });
    } catch (err: any) {
      // toast shown in parent
    } finally {
      setSaving(false);
    }
  };

  // Themes matching original study-vault-v10
  const bg = d ? "#0f172a" : "#ffffff";
  const border = d ? "#1e293b" : "#e2e8f0";
  const surface = d ? "#1e293b" : "#f1f5f9";
  const text = d ? "#f1f5f9" : "#0f172a";
  const muted = d ? "#94a3b8" : "#64748b";
  const editorBg = d ? "#020617" : "#ffffff";

  const selStyle: React.CSSProperties = {
    padding: "3px 6px",
    borderRadius: 6,
    border: `1px solid ${border}`,
    background: surface,
    color: text,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    outline: "none",
  };

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
        padding: "16px",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: bg,
          borderRadius: 20,
          border: `1px solid ${border}`,
          width: "100%",
          maxWidth: 880,
          height: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* Top Header: Title & Project selector */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: `1px solid ${border}`,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
          }}
        >
          <input
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              flex: 1,
              minWidth: 200,
              fontSize: 18,
              fontWeight: 700,
              background: "transparent",
              border: "none",
              outline: "none",
              color: text,
            }}
            autoFocus
          />

          <select
            value={selectedProjectId || ""}
            onChange={(e) => setSelectedProjectId(e.target.value || null)}
            style={{ ...selStyle, height: 34, fontSize: 13, minWidth: 140 }}
          >
            <option value="">No Subject (General)</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                📁 {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${border}`,
              background: "transparent",
              color: muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <NoteModalToolbar
          d={d}
          bg={bg}
          border={border}
          text={text}
          muted={muted}
          surface={surface}
          selStyle={selStyle}
          activeFormats={activeFormats}
          exec={exec}
          fontFamily={fontFamily}
          applyFontFamily={applyFontFamily}
          fontSize={fontSize}
          applyFontSize={applyFontSize}
          colorPickerRef={colorPickerRef}
          saveSelection={saveSelection}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
          restoreSelection={restoreSelection}
          handleFileUpload={handleFileUpload}
          showMathBar={showMathBar}
          setShowMathBar={setShowMathBar}
          setShowShortcutsModal={setShowShortcutsModal}
          insertMathSymbol={insertMathSymbol}
          editorRef={editorRef}
        />

        {/* Editor Body */}
        <NoteModalEditor
          editorRef={editorRef}
          handleKeyDown={handleEditorKeyDown}
          updateFormats={updateFormats}
          handlePaste={handlePaste}
          setIsDragging={setIsDragging}
          handleDrop={handleDrop}
          isDragging={isDragging}
          border={border}
          text={text}
          editorBg={editorBg}
          selectedImage={selectedImage}
          deleteIconPos={deleteIconPos}
          removeImage={removeImage}
        />

        {/* Attachment tray at bottom if any attachments */}
        {noteAttachments.length > 0 && (
          <div
            style={{
              padding: "10px 18px",
              borderTop: `1px solid ${border}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              overflowX: "auto",
              background: surface,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: muted }}>ATTACHMENTS:</span>
            {noteAttachments.map((att, i) => (
              <div key={i} style={{ width: 100, height: 75, flexShrink: 0 }}>
                <AttachmentPreview
                  attachment={att}
                  isDarkMode={d}
                  onRemove={() =>
                    setNoteAttachments((prev) => prev.filter((_, idx) => idx !== i))
                  }
                />
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <NoteModalFooter
          onClose={onClose}
          handleSave={handleSave}
          border={border}
          bg={bg}
          muted={muted}
          surface={surface}
          existingNote={existingNote}
        />
      </div>

      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        isDarkMode={d}
      />
    </div>
  );
};

export default NoteModal;
