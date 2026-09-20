"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Code,
  Heading1,
  Heading2,
  Paperclip,
  Loader2,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import { NoteEntry, ProjectEntry, AttachmentItem } from "../utils/types";

interface NoteModalProps {
  onClose: () => void;
  onSave: (noteData: {
    title: string;
    content: string;
    projectId?: string | null;
    attachments: AttachmentItem[];
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
  const [attachments, setAttachments] = useState<AttachmentItem[]>(
    existingNote?.attachments || []
  );
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [saving, setSaving] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && existingNote?.content) {
      editorRef.current.innerHTML = existingNote.content;
    }
  }, [existingNote]);

  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (typeof document !== "undefined") {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingAttachment(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve((ev.target?.result as string).split(",")[1]);
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
            folder: title.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        const newAtt: AttachmentItem = {
          filename: file.name,
          type: file.type,
          path: data.path,
          publicId: data.publicId,
          size: file.size,
        };

        setAttachments((prev) => [...prev, newAtt]);

        if (file.type.startsWith("image/")) {
          execCmd("insertImage", data.path);
        }

        toast.success(`Attached ${file.name}`);
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setUploadingAttachment(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = async (att: AttachmentItem) => {
    if (att.publicId) {
      try {
        await fetch("/tools/study-vault/api/attachments", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: att.publicId }),
        });
      } catch {}
    }
    setAttachments((prev) => prev.filter((a) => a.path !== att.path));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = editorRef.current?.innerHTML || "";
    if (!title.trim() && !content.trim()) {
      toast.error("Please add a title or content to save.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content,
        projectId: selectedProjectId,
        attachments,
      });
      onClose();
    } catch (err: any) {
      toast.error("Failed to save note: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [title, selectedProjectId, attachments]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden border ${
          d ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0 ${
            d ? "border-slate-800 bg-slate-900/90" : "border-slate-200 bg-slate-50/70"
          }`}
        >
          <input
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title…"
            className={`flex-1 text-lg sm:text-xl font-bold bg-transparent focus:outline-none ${
              d ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"
            }`}
          />

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                d
                  ? "bg-slate-800 border-slate-700 text-slate-200"
                  : "bg-white border-slate-300 text-slate-700"
              }`}
            >
              <option value="">No Subject</option>
              {allProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition ${
                d ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div
          className={`px-6 py-2 border-b flex items-center gap-1 flex-wrap shrink-0 ${
            d ? "border-slate-800 bg-slate-950/60" : "border-slate-200 bg-slate-50"
          }`}
        >
          <button
            type="button"
            onClick={() => execCmd("bold")}
            className={`p-1.5 rounded transition ${
              d ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            onClick={() => execCmd("italic")}
            className={`p-1.5 rounded transition ${
              d ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            onClick={() => execCmd("underline")}
            className={`p-1.5 rounded transition ${
              d ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline size={15} />
          </button>
          <button
            type="button"
            onClick={() => execCmd("strikeThrough")}
            className={`p-1.5 rounded transition ${
              d ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
            title="Strikethrough"
          >
            <Strikethrough size={15} />
          </button>

          <div className={`w-px h-4 mx-1 ${d ? "bg-slate-800" : "bg-slate-200"}`} />

          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<h1>")}
            className={`p-1.5 rounded transition ${
              d ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
            title="Heading 1"
          >
            <Heading1 size={15} />
          </button>
          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<h2>")}
            className={`p-1.5 rounded transition ${
              d ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
            title="Heading 2"
          >
            <Heading2 size={15} />
          </button>

          <div className={`w-px h-4 mx-1 ${d ? "bg-slate-800" : "bg-slate-200"}`} />

          <button
            type="button"
            onClick={() => execCmd("insertUnorderedList")}
            className={`p-1.5 rounded transition ${
              d ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
            title="Bullet List"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onClick={() => execCmd("insertOrderedList")}
            className={`p-1.5 rounded transition ${
              d ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
            title="Numbered List"
          >
            <ListOrdered size={15} />
          </button>
          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<pre>")}
            className={`p-1.5 rounded transition ${
              d ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
            title="Code Block"
          >
            <Code size={15} />
          </button>

          <div className={`w-px h-4 mx-1 ${d ? "bg-slate-800" : "bg-slate-200"}`} />

          <label
            className={`flex items-center gap-1 p-1.5 rounded transition cursor-pointer ${
              d ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
            title="Attach Image or PDF"
          >
            {uploadingAttachment ? (
              <Loader2 size={15} className="animate-spin text-blue-500" />
            ) : (
              <Paperclip size={15} />
            )}
            <span className="text-xs font-semibold ml-0.5">Attach</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploadingAttachment}
            />
          </label>
        </div>

        {/* Editor Body */}
        <div className={`flex-1 p-6 overflow-y-auto min-h-0 ${d ? "bg-slate-900" : "bg-white"}`}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className={`w-full h-full min-h-[300px] text-sm focus:outline-none max-w-none leading-relaxed ${
              d ? "text-slate-200 prose prose-invert" : "text-slate-800 prose"
            }`}
            style={{ minHeight: "100%" }}
          />
        </div>

        {/* Attachments Section */}
        {attachments.length > 0 && (
          <div
            className={`px-6 py-2.5 border-t shrink-0 flex items-center gap-2 overflow-x-auto ${
              d ? "bg-slate-950/70 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}
          >
            <span className={`text-[11px] font-bold shrink-0 ${d ? "text-slate-400" : "text-slate-500"}`}>
              Attachments ({attachments.length}):
            </span>
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs shrink-0 ${
                  d
                    ? "bg-slate-800 border-slate-700 text-slate-300"
                    : "bg-white border-slate-200 text-slate-700 shadow-sm"
                }`}
              >
                {att.type === "application/pdf" ? (
                  <BookOpen size={12} className="text-blue-500" />
                ) : (
                  <Paperclip size={12} className="text-emerald-500" />
                )}
                <span className="truncate max-w-[140px] text-[11px]">
                  {att.filename || "file"}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att)}
                  className="text-slate-400 hover:text-red-500 p-0.5 ml-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          className={`px-6 py-3.5 border-t flex items-center justify-between shrink-0 ${
            d ? "border-slate-800 bg-slate-900/90" : "border-slate-200 bg-slate-50"
          }`}
        >
          <p className="text-xs text-slate-400 font-mono">
            Press <kbd className={`px-1.5 py-0.5 rounded ${d ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-700"}`}>Ctrl+S</kbd> to save
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                d ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-200 hover:bg-slate-300 text-slate-700"
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-sm transition"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              <span>Save Note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;
