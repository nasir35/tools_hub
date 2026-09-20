"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Upload,
  Clock,
  Bookmark,
  Layers,
  Trash2,
  Edit3,
  FileDown,
  Play,
  X,
  HardDrive,
  Cloud,
  FolderSearch,
  Check,
  AlertTriangle,
  Plus,
  FileText,
  ArrowLeft,
  Loader2,
  Calendar,
  LayoutGrid,
  Menu,
  BarChart3,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  NoteEntry,
  ProjectEntry,
  PdfEntry,
  SessionEntry,
  StudyTimeEntry,
  AttachmentItem,
} from "./utils/types";
import { NoteCard } from "./components/NoteCard";
import { NotesGrid } from "./components/NotesGrid";
import { NoteModal } from "./components/NoteModal";
import { NoteDetailView } from "./components/NoteDetailView";
import { ProjectModal } from "./components/ProjectModal";
import { SummaryPage } from "./components/SummaryPage";
import { NASPanel } from "./components/NASPanel";
import { exportStudySnipsPdf } from "./utils/exportStudySnipsPdf";

export default function StudyVaultApp() {
  const router = useRouter();

  // Primary Collections
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [studyTimes, setStudyTimes] = useState<StudyTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation and Views
  const [activeView, setActiveView] = useState<"notes" | "pdfs" | "sessions" | "summary">("notes");
  const [activeProject, setActiveProject] = useState<ProjectEntry | "all">("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"compact" | "medium" | "expanded">("medium");

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "3days" | "7days" | "month">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name" | "snips">("newest");

  // Modals & Active items
  const [selectedNote, setSelectedNote] = useState<NoteEntry | null>(null);
  const [editingNote, setEditingNote] = useState<NoteEntry | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectEntry | null>(null);

  // Local PDF Linker states
  const [showLocalModal, setShowLocalModal] = useState(false);
  const [localModalTab, setLocalModalTab] = useState<"path" | "scan">("path");
  const [localPathInput, setLocalPathInput] = useState("");
  const [localNameInput, setLocalNameInput] = useState("");
  const [localValidation, setLocalValidation] = useState<any>(null);
  const [validatingLocal, setValidatingLocal] = useState(false);
  const [linkingLocal, setLinkingLocal] = useState(false);

  // Directory Scanner states
  const [scanDirInput, setScanDirInput] = useState("");
  const [scanningDir, setScanningDir] = useState(false);
  const [scannedResults, setScannedResults] = useState<{
    directory: string;
    totalFound: number;
    files: { name: string; path: string; size: number; isImported?: boolean }[];
  } | null>(null);
  const [scanImporting, setScanImporting] = useState<Record<string, boolean>>({});

  // Session Viewer modal
  const [viewingSession, setViewingSession] = useState<SessionEntry | null>(null);

  // Cloud Upload states
  const [uploadingCloud, setUploadingCloud] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit / Relink Modal for PDF
  const [editingPdf, setEditingPdf] = useState<PdfEntry | null>(null);
  const [editPdfName, setEditPdfName] = useState("");
  const [editPdfLocalPath, setEditPdfLocalPath] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [nRes, prRes, pRes, sRes, tRes] = await Promise.all([
        fetch("/tools/study-vault/api/notes"),
        fetch("/tools/study-vault/api/projects"),
        fetch("/tools/study-vault/api/pdfs"),
        fetch("/tools/study-vault/api/sessions"),
        fetch("/tools/study-vault/api/time"),
      ]);

      const [nData, prData, pData, sData, tData] = await Promise.all([
        nRes.ok ? nRes.json() : [],
        prRes.ok ? prRes.json() : [],
        pRes.ok ? pRes.json() : [],
        sRes.ok ? sRes.json() : [],
        tRes.ok ? tRes.json() : [],
      ]);

      setNotes(Array.isArray(nData) ? nData : []);
      setProjects(Array.isArray(prData) ? prData : []);
      setPdfs(Array.isArray(pData) ? pData : []);
      setSessions(Array.isArray(sData) ? sData : []);
      setStudyTimes(Array.isArray(tData) ? tData : []);
    } catch (err: any) {
      toast.error("Failed to load study vault: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Note CRUD handlers
  const handleSaveNote = async (noteData: {
    title: string;
    content: string;
    projectId?: string | null;
    attachments: AttachmentItem[];
  }) => {
    try {
      const url = editingNote
        ? `/tools/study-vault/api/notes/${editingNote.id}`
        : `/tools/study-vault/api/notes`;
      const method = editingNote ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save note");
      }

      toast.success(editingNote ? "Note updated!" : "Note created!");
      setEditingNote(null);
      setShowNoteModal(false);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to save note");
      throw err;
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      const res = await fetch(`/tools/study-vault/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      toast.success("Note deleted");
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) setSelectedNote(null);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      const res = await fetch(`/tools/study-vault/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !currentPin }),
      });
      if (res.ok) {
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, pinned: !currentPin } : n))
        );
      }
    } catch {}
  };

  // Project deletion
  const handleDeleteProject = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the subject "${name}" and all notes inside it?`
      )
    )
      return;
    try {
      const res = await fetch(`/tools/study-vault/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      toast.success("Subject deleted");
      if (activeProject !== "all" && activeProject.id === id) {
        setActiveProject("all");
      }
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  // Local PDF validation
  const validateLocalPath = useCallback(async (pathToCheck: string) => {
    const clean = (pathToCheck || "").trim().replace(/^["']|["']$/g, "");
    if (!clean) {
      setLocalValidation(null);
      return;
    }
    setValidatingLocal(true);
    try {
      const res = await fetch("/tools/study-vault/api/pdfs/local/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localPath: clean }),
      });
      const data = await res.json();
      setLocalValidation(data);
      if (data.valid && !localNameInput) {
        setLocalNameInput(data.filename || "");
      }
    } catch (err: any) {
      setLocalValidation({ valid: false, message: err.message });
    } finally {
      setValidatingLocal(false);
    }
  }, [localNameInput]);

  const handleLinkLocalPdf = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = localPathInput.trim().replace(/^["']|["']$/g, "");
    if (!clean) return;
    setLinkingLocal(true);
    try {
      const res = await fetch("/tools/study-vault/api/pdfs/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localPath: clean,
          originalName: localNameInput.trim() || undefined,
          projectId: activeProject !== "all" ? activeProject.id : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to link local PDF");
      toast.success("Local PDF linked successfully!");
      setShowLocalModal(false);
      setLocalPathInput("");
      setLocalNameInput("");
      setLocalValidation(null);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to link local PDF");
    } finally {
      setLinkingLocal(false);
    }
  };

  const handleScanDirectory = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setScanningDir(true);
    try {
      const res = await fetch("/tools/study-vault/api/pdfs/local/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directoryPath: scanDirInput.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scan folder");
      setScannedResults(data);
    } catch (err: any) {
      toast.error(err.message || "Folder scan failed");
    } finally {
      setScanningDir(false);
    }
  };

  const handleImportScannedFile = async (file: { name: string; path: string }) => {
    setScanImporting((prev) => ({ ...prev, [file.path]: true }));
    try {
      const res = await fetch("/tools/study-vault/api/pdfs/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localPath: file.path,
          originalName: file.name,
          projectId: activeProject !== "all" ? activeProject.id : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Import failed");
      }
      setScannedResults((prev) =>
        prev
          ? {
              ...prev,
              files: prev.files.map((f) => (f.path === file.path ? { ...f, isImported: true } : f)),
            }
          : prev
      );
      toast.success(`Imported: ${file.name}`);
      await fetchAll();
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setScanImporting((prev) => ({ ...prev, [file.path]: false }));
    }
  };

  const handleImportAllScanned = async () => {
    if (!scannedResults?.files) return;
    const unimported = scannedResults.files.filter((f) => !f.isImported);
    for (const f of unimported) {
      await handleImportScannedFile(f);
    }
  };

  const handleCloudUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file.");
      return;
    }
    setUploadingCloud(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve((ev.target?.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/tools/study-vault/api/pdfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64,
          filename: file.name,
          originalName: file.name,
          projectId: activeProject !== "all" ? activeProject.id : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cloud upload failed");
      toast.success("PDF uploaded to cloud!");
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingCloud(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePdf = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`/tools/study-vault/api/pdfs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete PDF");
      toast.success("Document deleted");
      setPdfs((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleSaveEditPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPdf) return;
    try {
      const res = await fetch(`/tools/study-vault/api/pdfs/${editingPdf.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalName: editPdfName.trim() || undefined,
          localPath:
            editingPdf.storageType === "local" ? editPdfLocalPath.trim() || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Update failed");
      toast.success("Document updated!");
      setEditingPdf(null);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update document");
    }
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    let result = [...notes];
    if (activeProject !== "all") {
      result = result.filter((n) => n.projectId === activeProject.id);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    if (dateFilter !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (dateFilter === "3days") cutoff.setDate(now.getDate() - 3);
      else if (dateFilter === "7days") cutoff.setDate(now.getDate() - 7);
      else if (dateFilter === "month") cutoff.setMonth(now.getMonth() - 1);
      result = result.filter((n) => new Date(n.updatedAt) >= cutoff);
    }

    result.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortOrder === "name") return a.title.localeCompare(b.title);
      if (sortOrder === "oldest") {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return result;
  }, [notes, activeProject, searchQuery, dateFilter, sortOrder]);

  // Filtered PDFs
  const filteredPdfs = useMemo(() => {
    let result = [...pdfs];
    if (activeProject !== "all") {
      result = result.filter((p) => p.projectId === activeProject.id);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.originalName.toLowerCase().includes(q) || p.localPath?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortOrder === "name") return a.originalName.localeCompare(b.originalName);
      if (sortOrder === "snips") {
        return (b.studyData?.snips?.length || 0) - (a.studyData?.snips?.length || 0);
      }
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });
    return result;
  }, [pdfs, activeProject, searchQuery, sortOrder]);

  // If a note is selected, show detail view
  if (selectedNote) {
    const proj = projects.find((p) => p.id === selectedNote.projectId) || null;
    return (
      <NoteDetailView
        note={selectedNote}
        project={proj}
        onBack={() => setSelectedNote(null)}
        onEdit={() => {
          setEditingNote(selectedNote);
          setSelectedNote(null);
          setShowNoteModal(true);
        }}
        onDelete={() => handleDeleteNote(selectedNote.id)}
        onOpenStudyPdf={(pdfUrl, name) => {
          // If already in library, navigate to read page
          const match = pdfs.find((p) => p.filename === pdfUrl || p.localPath === pdfUrl);
          if (match) {
            router.push(`/tools/study-vault/read/${match.id}`);
          } else {
            toast("Opening document in study reader…");
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col sm:flex-row overflow-hidden">
      {/* ── Collapsible Left Sidebar ── */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Back to Tools Hub"
              >
                <ArrowLeft size={16} />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                  <BookOpen size={16} />
                </div>
                <span className="font-bold text-sm text-white">Study Vault</span>
              </div>
            </div>
          ) : (
            <Link
              href="/"
              className="p-2 text-slate-400 hover:text-white mx-auto"
              title="Back to Tools Hub"
            >
              <ArrowLeft size={18} />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Main Navigation Views */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveView("notes")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition ${
                activeView === "notes"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <FileText size={16} />
              {sidebarOpen && <span>Notes ({notes.length})</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveView("pdfs")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition ${
                activeView === "pdfs"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <BookOpen size={16} />
              {sidebarOpen && <span>Study PDFs ({pdfs.length})</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveView("sessions")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition ${
                activeView === "sessions"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Layers size={16} />
              {sidebarOpen && <span>Study Sessions ({sessions.length})</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveView("summary")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition ${
                activeView === "summary"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <BarChart3 size={16} />
              {sidebarOpen && <span>Analytics & Time</span>}
            </button>
          </div>

          {/* Subjects / Projects Folder List */}
          {sidebarOpen && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 px-2 font-bold uppercase tracking-wider text-[10px]">
                <span>Subjects</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProject(null);
                    setShowProjectModal(true);
                  }}
                  className="p-1 hover:text-white rounded hover:bg-slate-800"
                  title="Create new subject"
                >
                  <Plus size={13} />
                </button>
              </div>

              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setActiveProject("all")}
                  className={`w-full text-left px-3 py-1.5 rounded-xl font-medium transition flex items-center justify-between ${
                    activeProject === "all"
                      ? "bg-slate-800 text-blue-400 font-bold"
                      : "text-slate-300 hover:bg-slate-800/60"
                  }`}
                >
                  <span>All Subjects</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {notes.length}
                  </span>
                </button>

                {projects.map((proj) => {
                  const isSelected = activeProject !== "all" && activeProject.id === proj.id;
                  const count = notes.filter((n) => n.projectId === proj.id).length;

                  return (
                    <div
                      key={proj.id}
                      className={`group flex items-center justify-between px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        isSelected
                          ? "bg-slate-800 text-white font-bold"
                          : "text-slate-300 hover:bg-slate-800/60"
                      }`}
                      onClick={() => setActiveProject(proj)}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color }}
                        />
                        <span className="truncate">{proj.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-mono group-hover:hidden">
                          {count}
                        </span>
                        <div className="hidden group-hover:flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProject(proj);
                              setShowProjectModal(true);
                            }}
                            className="p-0.5 text-slate-400 hover:text-white rounded"
                            title="Edit subject"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(proj.id, proj.name);
                            }}
                            className="p-0.5 text-slate-400 hover:text-red-400 rounded"
                            title="Delete subject"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Workspace Area ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0 flex items-center justify-between gap-4 flex-wrap">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, textbooks, snips…"
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action buttons and view controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeView === "notes" && (
              <>
                {/* View Mode Toggle */}
                <div className="flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-400">
                  <button
                    type="button"
                    onClick={() => setViewMode("compact")}
                    className={`p-1 rounded-lg transition ${
                      viewMode === "compact" ? "bg-slate-700 text-white" : "hover:text-white"
                    }`}
                    title="Compact view"
                  >
                    <LayoutGrid size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("medium")}
                    className={`p-1 rounded-lg transition ${
                      viewMode === "medium" ? "bg-slate-700 text-white" : "hover:text-white"
                    }`}
                    title="Grid view"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("expanded")}
                    className={`p-1 rounded-lg transition ${
                      viewMode === "expanded" ? "bg-slate-700 text-white" : "hover:text-white"
                    }`}
                    title="Expanded view"
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingNote(null);
                    setShowNoteModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <Plus size={14} />
                  <span>New Note</span>
                </button>
              </>
            )}

            {activeView === "pdfs" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setLocalModalTab("path");
                    setShowLocalModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <HardDrive size={13} />
                  <span>Link Local PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLocalModalTab("scan");
                    setShowLocalModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  <FolderSearch size={13} />
                  <span>Scan Folder</span>
                </button>

                <label className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition">
                  {uploadingCloud ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Upload size={13} />
                  )}
                  <span>Upload PDF</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleCloudUpload}
                    disabled={uploadingCloud}
                  />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs font-medium">Loading Study Vault…</p>
            </div>
          ) : activeView === "notes" ? (
            <NotesGrid
              notes={filteredNotes}
              projects={projects}
              viewMode={viewMode}
              onSelectNote={(n) => setSelectedNote(n)}
              onEditNote={(n) => {
                setEditingNote(n);
                setShowNoteModal(true);
              }}
              onDeleteNote={handleDeleteNote}
              onTogglePin={handleTogglePin}
              onCreateNote={() => {
                setEditingNote(null);
                setShowNoteModal(true);
              }}
            />
          ) : activeView === "pdfs" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing {filteredPdfs.length} document{filteredPdfs.length !== 1 ? "s" : ""}
                </span>
              </div>

              {filteredPdfs.length === 0 ? (
                <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-3">
                  <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-white">No PDF documents found</h3>
                  <p className="text-xs text-slate-400">
                    Link a local file path on your computer for instant streaming, or upload a PDF.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPdfs.map((pdf) => {
                    const isLocal = pdf.storageType === "local";
                    const snipCount = pdf.studyData?.snips?.length || 0;

                    return (
                      <div
                        key={pdf.id}
                        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isLocal
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              }`}
                            >
                              {isLocal ? <HardDrive size={10} /> : <Cloud size={10} />}
                              <span>{isLocal ? "Local Storage" : "Cloud"}</span>
                            </span>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPdf(pdf);
                                  setEditPdfName(pdf.originalName);
                                  setEditPdfLocalPath(pdf.localPath || "");
                                }}
                                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                                title="Edit details"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePdf(pdf.id, pdf.originalName)}
                                className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                                title="Delete document"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <h3
                            className="font-bold text-sm text-white line-clamp-2"
                            title={pdf.originalName}
                          >
                            {pdf.originalName}
                          </h3>

                          {isLocal && pdf.localPath && (
                            <p className="text-[11px] font-mono text-slate-400 truncate bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                              {pdf.localPath}
                            </p>
                          )}
                        </div>

                        <div className="pt-4 border-t border-slate-800/80 mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Bookmark size={12} className="text-amber-400" />
                              <span>{snipCount}</span>
                            </span>
                            <span>·</span>
                            <span>{new Date(pdf.uploadedAt).toLocaleDateString()}</span>
                          </div>

                          <Link
                            href={`/tools/study-vault/read/${pdf.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                          >
                            <Play size={12} fill="currentColor" />
                            <span>Study Mode</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeView === "sessions" ? (
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-2">
                  <Layers className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-white">No study sessions recorded yet</h3>
                  <p className="text-xs text-slate-400">
                    Open documents in Study Mode to capture snips and record study sessions.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{new Date(sess.startedAt).toLocaleDateString()}</span>
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-white line-clamp-1 mb-2">
                          {sess.title}
                        </h3>

                        <p className="text-xs text-slate-400">
                          {sess.snips?.length || 0} snip{sess.snips?.length !== 1 ? "s" : ""} saved
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800 mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => exportStudySnipsPdf(sess.title, sess.snips || [])}
                          className="flex items-center gap-1 text-xs text-slate-300 hover:text-white"
                        >
                          <FileDown size={13} />
                          <span>Export PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setViewingSession(sess)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                        >
                          View Snips
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <SummaryPage
              notes={notes}
              projects={projects}
              pdfs={pdfs}
              sessions={sessions}
              studyTimes={studyTimes}
            />
          )}
        </div>
      </div>

      {/* Note Edit Modal */}
      {showNoteModal && (
        <NoteModal
          onClose={() => {
            setShowNoteModal(false);
            setEditingNote(null);
          }}
          onSave={handleSaveNote}
          existingNote={editingNote}
          defaultProjectId={activeProject !== "all" ? activeProject.id : null}
          allProjects={projects}
        />
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <ProjectModal
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
          onProjectSaved={fetchAll}
          existingProject={editingProject}
        />
      )}

      {/* Link Local PDF & Folder Scanner Modal */}
      {showLocalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <HardDrive size={18} />
                </div>
                <h3 className="text-sm font-bold text-white">Add Local PDF Documents</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLocalModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setLocalModalTab("path")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  localModalTab === "path"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Single PDF File Path
              </button>
              <button
                type="button"
                onClick={() => setLocalModalTab("scan")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  localModalTab === "scan"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Folder Scanner
              </button>
            </div>

            {localModalTab === "path" && (
              <form onSubmit={handleLinkLocalPdf} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Local PDF File Path:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      value={localPathInput}
                      onChange={(e) => {
                        setLocalPathInput(e.target.value);
                        validateLocalPath(e.target.value);
                      }}
                      placeholder="e.g. C:\Users\name\Documents\Textbook.pdf"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {validatingLocal && (
                      <Loader2
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-400"
                      />
                    )}
                  </div>
                </div>

                {localValidation && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      localValidation.valid
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                        : "bg-red-500/10 border-red-500/20 text-red-300"
                    }`}
                  >
                    {localValidation.valid ? (
                      <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {localValidation.valid ? "Valid PDF found!" : "File not accessible"}
                      </p>
                      {localValidation.valid && (
                        <p className="text-[11px] opacity-80 mt-0.5">
                          Size: {(localValidation.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Title (Optional):
                  </label>
                  <input
                    type="text"
                    value={localNameInput}
                    onChange={(e) => setLocalNameInput(e.target.value)}
                    placeholder="Leave blank to use filename"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLocalModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={linkingLocal || !localPathInput.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2"
                  >
                    {linkingLocal ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    <span>Link Document</span>
                  </button>
                </div>
              </form>
            )}

            {localModalTab === "scan" && (
              <div className="space-y-3">
                <form onSubmit={handleScanDirectory} className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Directory to Scan:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scanDirInput}
                      onChange={(e) => setScanDirInput(e.target.value)}
                      placeholder="e.g. C:\Books or E:\StudyPdfs"
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={scanningDir}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      {scanningDir ? <Loader2 size={13} className="animate-spin" /> : <FolderSearch size={13} />}
                      <span>Scan</span>
                    </button>
                  </div>
                </form>

                {scannedResults && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">
                        Found {scannedResults.totalFound} PDFs in directory
                      </span>
                      {scannedResults.files.some((f) => !f.isImported) && (
                        <button
                          type="button"
                          onClick={handleImportAllScanned}
                          className="text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          Import All
                        </button>
                      )}
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                      {scannedResults.files.map((file, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-200 truncate">{file.name}</p>
                            <p className="text-[10px] font-mono text-slate-400 truncate">{file.path}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleImportScannedFile(file)}
                            disabled={file.isImported || scanImporting[file.path]}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                              file.isImported
                                ? "bg-slate-700 text-slate-400 cursor-default"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {file.isImported ? (
                              <span className="flex items-center gap-1">
                                <Check size={12} />
                                <span>Imported</span>
                              </span>
                            ) : scanImporting[file.path] ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              "Import"
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit PDF Details Modal */}
      {editingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Edit Document Details</h3>
              <button
                type="button"
                onClick={() => setEditingPdf(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditPdf} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document Name:
                </label>
                <input
                  type="text"
                  value={editPdfName}
                  onChange={(e) => setEditPdfName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {editingPdf.storageType === "local" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Local File Path:
                  </label>
                  <input
                    type="text"
                    value={editPdfLocalPath}
                    onChange={(e) => setEditPdfLocalPath(e.target.value)}
                    placeholder="e.g. C:\Docs\Book.pdf"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPdf(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Session Snips Modal */}
      {viewingSession && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 animate-fadeIn">
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewingSession(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="text-sm font-bold text-white">{viewingSession.title}</h2>
                <p className="text-xs text-slate-400">
                  {viewingSession.snips?.length || 0} snips saved · Created{" "}
                  {new Date(viewingSession.startedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  exportStudySnipsPdf(viewingSession.title, viewingSession.snips || [])
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                <FileDown size={13} />
                <span>Export PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingSession(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-4xl w-full mx-auto p-4 overflow-hidden">
            <NASPanel
              session={viewingSession}
              onDeleteSnip={(snipId) => {
                const updated = (viewingSession.snips || []).filter((s) => s.id !== snipId);
                setViewingSession({ ...viewingSession, snips: updated });
                fetch(`/tools/study-vault/api/sessions/${viewingSession.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ snips: updated }),
                });
              }}
              onUpdateSnipNote={(snipId, note) => {
                const updated = (viewingSession.snips || []).map((s) =>
                  s.id === snipId ? { ...s, note } : s
                );
                setViewingSession({ ...viewingSession, snips: updated });
                fetch(`/tools/study-vault/api/sessions/${viewingSession.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ snips: updated }),
                });
              }}
              onDownload={() =>
                exportStudySnipsPdf(viewingSession.title, viewingSession.snips || [])
              }
              isDarkMode={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
