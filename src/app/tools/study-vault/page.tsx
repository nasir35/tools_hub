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
  RefreshCw,
  Plus,
  FileText,
  ArrowLeft,
  Loader2,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import { PdfEntry, SessionEntry, StudyTimeEntry, Snip } from "./utils/types";
import { NASPanel } from "./components/NASPanel";
import { exportStudySnipsPdf } from "./utils/exportStudySnipsPdf";

export default function StudyVaultPage() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [studyTimes, setStudyTimes] = useState<StudyTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "snips">("newest");
  const [activeTab, setActiveTab] = useState<"pdfs" | "sessions">("pdfs");

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

  // Edit / Relink Modal
  const [editingPdf, setEditingPdf] = useState<PdfEntry | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocalPath, setEditLocalPath] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, sRes, tRes] = await Promise.all([
        fetch("/tools/study-vault/api/pdfs"),
        fetch("/tools/study-vault/api/sessions"),
        fetch("/tools/study-vault/api/time"),
      ]);

      const [pData, sData, tData] = await Promise.all([
        pRes.ok ? pRes.json() : [],
        sRes.ok ? sRes.json() : [],
        tRes.ok ? tRes.json() : [],
      ]);

      setPdfs(Array.isArray(pData) ? pData : []);
      setSessions(Array.isArray(sData) ? sData : []);
      setStudyTimes(Array.isArray(tData) ? tData : []);
    } catch (err: any) {
      setError("Failed to load study vault: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Validate local path as user types
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
          originalName: editName.trim() || undefined,
          localPath: editingPdf.storageType === "local" ? editLocalPath.trim() || undefined : undefined,
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

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study session?")) return;
    try {
      const res = await fetch(`/tools/study-vault/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete session");
      toast.success("Session deleted");
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (viewingSession?.id === id) setViewingSession(null);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalPdfs = pdfs.length;
    const totalSessions = sessions.length;
    const totalSnips = pdfs.reduce((acc, p) => acc + (p.studyData?.snips?.length || 0), 0);
    const today = new Date().toISOString().split("T")[0];
    const todaySeconds = studyTimes
      .filter((t) => t.date === today)
      .reduce((acc, t) => acc + (t.duration || 0), 0);

    const formatSeconds = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    };

    return {
      totalPdfs,
      totalSessions,
      totalSnips,
      todayStudyTimeStr: formatSeconds(todaySeconds),
    };
  }, [pdfs, sessions, studyTimes]);

  // Filtered and Sorted PDFs
  const filteredPdfs = useMemo(() => {
    let result = [...pdfs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.originalName.toLowerCase().includes(q) ||
          p.localPath?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortBy === "name") return a.originalName.localeCompare(b.originalName);
      if (sortBy === "snips") {
        return (b.studyData?.snips?.length || 0) - (a.studyData?.snips?.length || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });
    return result;
  }, [pdfs, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition"
              title="Back to Tools"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Study Vault</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                  Pro
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Study PDFs, snip notes, smart annotations, and instant local disk streaming
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setLocalModalTab("path");
                setShowLocalModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <HardDrive size={14} />
              <span>Link Local PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLocalModalTab("scan");
                setShowLocalModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition"
            >
              <FolderSearch size={14} />
              <span>Scan Folder</span>
            </button>

            <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold cursor-pointer transition">
              {uploadingCloud ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>{uploadingCloud ? "Uploading…" : "Upload PDF"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleCloudUpload}
                disabled={uploadingCloud}
              />
            </label>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Total PDFs</span>
              <FileText size={16} className="text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{metrics.totalPdfs}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Study Sessions</span>
              <Layers size={16} className="text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{metrics.totalSessions}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Snips & Notes</span>
              <Bookmark size={16} className="text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white">{metrics.totalSnips}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Study Time Today</span>
              <Clock size={16} className="text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">{metrics.todayStudyTimeStr}</p>
          </div>
        </div>

        {/* Tab Selector & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("pdfs")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "pdfs"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Documents ({pdfs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sessions")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "sessions"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sessions ({sessions.length})
            </button>
          </div>

          {activeTab === "pdfs" && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search PDFs…"
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="snips">Most Snips</option>
              </select>
            </div>
          )}
        </div>

        {/* Content: PDF Grid */}
        {activeTab === "pdfs" && (
          <div>
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-xs">Loading documents…</p>
              </div>
            ) : filteredPdfs.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                  <FileText size={28} />
                </div>
                <h3 className="text-base font-bold text-white">No documents found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Link a local PDF file from your computer or upload a PDF to get started with instant study mode.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLocalModalTab("path");
                      setShowLocalModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
                  >
                    Link Local PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPdfs.map((pdf) => {
                  const snipCount = pdf.studyData?.snips?.length || 0;
                  const isLocal = pdf.storageType === "local";

                  return (
                    <div
                      key={pdf.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group relative shadow-sm"
                    >
                      <div className="space-y-2">
                        {/* Badges */}
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
                                setEditName(pdf.originalName);
                                setEditLocalPath(pdf.localPath || "");
                              }}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                              title="Edit document name or path"
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

                        {/* Title */}
                        <h3
                          className="font-bold text-sm text-white line-clamp-2"
                          title={pdf.originalName}
                        >
                          {pdf.originalName}
                        </h3>

                        {/* Path details */}
                        {isLocal && pdf.localPath && (
                          <p className="text-[11px] font-mono text-slate-400 truncate bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                            {pdf.localPath}
                          </p>
                        )}
                      </div>

                      {/* Footer */}
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
                          <span>Study</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Content: Sessions List */}
        {activeTab === "sessions" && (
          <div>
            {sessions.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-2">
                <Layers className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">No study sessions recorded yet</h3>
                <p className="text-xs text-slate-400">
                  Open any document in Study Mode and capture snips or notes to create study sessions.
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
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(sess.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded"
                          title="Delete session"
                        >
                          <Trash2 size={13} />
                        </button>
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
                        title="Export snips to PDF"
                      >
                        <FileDown size={13} />
                        <span>Export</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewingSession(sess)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                      >
                        <span>View Snips</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Link Local PDF & Scanner Modal */}
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

              {/* Sub-tabs: Single Path vs Folder Scan */}
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

              {/* Tab 1: Single Path */}
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

                  {/* Validation Feedback */}
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
                          {localValidation.valid ? "Valid PDF document found!" : "File not accessible"}
                        </p>
                        {localValidation.valid && (
                          <p className="text-[11px] opacity-80 mt-0.5">
                            Size: {(localValidation.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        )}
                        {!localValidation.valid && (
                          <p className="text-[11px] opacity-80 mt-0.5">
                            {localValidation.message || "Please check the path and permissions"}
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

              {/* Tab 2: Folder Scanner */}
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

                  {/* Scanned Results */}
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

        {/* Edit / Relink Modal */}
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
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {editingPdf.storageType === "local" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Local File Path:
                    </label>
                    <input
                      type="text"
                      value={editLocalPath}
                      onChange={(e) => setEditLocalPath(e.target.value)}
                      placeholder="e.g. C:\Docs\Book.pdf"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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

        {/* Viewing Session Snips Modal */}
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
    </div>
  );
}
