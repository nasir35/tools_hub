"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Search,
  List,
  ChevronRight,
  Copy,
  Check,
  X,
  Plus,
  HardDrive,
  ArrowLeft,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTabManager } from "../../utils/useTabManager";
import { StudyToolbar } from "../../components/StudyToolbar";
import { NASPanel } from "../../components/NASPanel";
import { exportStudySnipsPdf } from "../../utils/exportStudySnipsPdf";
import { PdfEntry, Snip, SessionEntry, Annotation } from "../../utils/types";

// Dynamically import PDF renderer to prevent SSR canvas / DOMMatrix issues
const StudyPDFRenderer = dynamic(
  () => import("../../components/StudyPDFRenderer"),
  { ssr: false }
);

export default function StudyReaderPage() {
  const params = useParams();
  const router = useRouter();
  const pdfId = params?.id as string;

  const { tabs, activeTab, addTab, closeTab, patchTab, setActiveTab } = useTabManager();
  const [snipModal, setSnipModal] = useState<{
    imageData: string;
    page: number;
    rect: any;
    tabIdx: number;
  } | null>(null);
  const [snipNote, setSnipNote] = useState("");
  const [snipCopied, setSnipCopied] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Additional PDF Tab Picker
  const [showPdfPicker, setShowPdfPicker] = useState(false);
  const [availablePdfs, setAvailablePdfs] = useState<PdfEntry[]>([]);
  const [pickerUploading, setPickerUploading] = useState(false);
  const [pickerLocalPath, setPickerLocalPath] = useState("");
  const pickerFileRef = useRef<HTMLInputElement>(null);

  // Active study session
  const [currentSession, setCurrentSession] = useState<SessionEntry | null>(null);

  // Left Sidebar state (Outline, Search)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"outline" | "search">("outline");
  const [docOutlines, setDocOutlines] = useState<Record<string, any[]>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Annotation history
  const [historyState, setHistoryState] = useState<{ canUndo: boolean; canRedo: boolean }>({
    canUndo: false,
    canRedo: false,
  });

  // Study timer state (active seconds + heartbeat)
  const [elapsedStudyTime, setElapsedStudyTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const pendingDurationRef = useRef(0);

  const rendererRef = useRef<any>(null);

  // Heartbeat Time Saver
  const flushStudyTime = useCallback(
    async (targetPdfId: string, pdfName: string, sessionId?: string | null) => {
      const delta = pendingDurationRef.current;
      if (delta < 5) return;
      pendingDurationRef.current = 0;
      try {
        await fetch(`/tools/study-vault/api/time`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfId: targetPdfId || null,
            pdfName: pdfName || "",
            sessionId: sessionId || null,
            duration: Math.round(delta),
            date: new Date().toISOString().split("T")[0],
          }),
        });
      } catch {}
    },
    []
  );

  // Timer Tick
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setElapsedStudyTime((prev) => prev + 1);
      pendingDurationRef.current += 1;

      if (pendingDurationRef.current >= 60) {
        const tab = tabs[activeTab];
        if (tab?.pdfEntry) {
          flushStudyTime(tab.pdfEntry.id, tab.pdfEntry.originalName, currentSession?.id);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, tabs, activeTab, currentSession, flushStudyTime]);

  // Unload flush
  useEffect(() => {
    const handleUnload = () => {
      const tab = tabs[activeTab];
      if (tab?.pdfEntry && pendingDurationRef.current >= 5) {
        flushStudyTime(tab.pdfEntry.id, tab.pdfEntry.originalName, currentSession?.id);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
    };
  }, [tabs, activeTab, currentSession, flushStudyTime]);

  const patchPdfEntry = useCallback(
    (tabIdx: number, updater: (entry: PdfEntry) => PdfEntry) => {
      const current = tabs[tabIdx];
      if (!current) return;
      const nextPdf = updater(current.pdfEntry);
      patchTab(tabIdx, { pdfEntry: nextPdf });
    },
    [patchTab, tabs]
  );

  // Fetch initial PDF & create study session
  useEffect(() => {
    if (!pdfId) return;
    (async () => {
      try {
        const pRes = await fetch(`/tools/study-vault/api/pdfs/${pdfId}`);
        if (!pRes.ok) throw new Error("Failed to load PDF metadata");
        const pdfData: PdfEntry = await pRes.json();

        // Create study session
        const title = `Session - ${pdfData.originalName} (${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })})`;
        const sRes = await fetch(`/tools/study-vault/api/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, projectId: pdfData.projectId }),
        });
        const sessionData: SessionEntry = sRes.ok ? await sRes.json() : null;

        setCurrentSession(sessionData);
        addTab({ pdfEntry: pdfData, rotation: 0 });
      } catch (err: any) {
        setInitError(err.message || "Failed to initialize reader");
      } finally {
        setInitializing(false);
      }
    })();
  }, [pdfId, addTab]);

  const currentTab = tabs[activeTab];

  // Save Snip handler
  const saveSnip = async () => {
    if (!snipModal || !currentTab?.pdfEntry) return;

    const newSnip: Snip = {
      id: `snip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      attachmentPath: snipModal.imageData,
      filename: `snip_${Date.now()}.png`,
      note: snipNote,
      page: snipModal.page,
      rect: snipModal.rect,
      pdfName: currentTab.pdfEntry.originalName,
      pdfId: currentTab.pdfEntry.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextPdfSnips = [...(currentTab.pdfEntry.studyData?.snips || []), newSnip];
    patchPdfEntry(snipModal.tabIdx, (p) => ({
      ...p,
      studyData: {
        ...p.studyData,
        snips: nextPdfSnips,
        updatedAt: new Date().toISOString(),
      },
    }));

    // Persist to PDF document studyData
    try {
      await fetch(`/tools/study-vault/api/pdfs/${currentTab.pdfEntry.id}/study-data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snips: nextPdfSnips }),
      });
    } catch {}

    // Add to current session
    if (currentSession?.id) {
      const nextSessionSnips = [...(currentSession.snips || []), newSnip];
      setCurrentSession((prev) => (prev ? { ...prev, snips: nextSessionSnips } : prev));
      try {
        await fetch(`/tools/study-vault/api/sessions/${currentSession.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snips: nextSessionSnips }),
        });
      } catch {}
    }

    patchTab(snipModal.tabIdx, { nasPanelOpen: true });
    setSnipModal(null);
    setSnipNote("");
    toast.success("Snip saved!");
  };

  const copySnipImage = async () => {
    if (!snipModal?.imageData) return;
    try {
      const img = new Image();
      img.src = snipModal.imageData;
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d")?.drawImage(img, 0, 0);
        c.toBlob(async (blob) => {
          if (blob && navigator.clipboard?.write) {
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            setSnipCopied(true);
            toast.success("Copied image to clipboard!");
            setTimeout(() => setSnipCopied(false), 2000);
          }
        });
      };
    } catch {}
  };

  const handleAnnotationsChange = async (newAnnotations: Annotation[]) => {
    if (!currentTab?.pdfEntry) return;
    patchPdfEntry(activeTab, (p) => ({
      ...p,
      studyData: {
        ...p.studyData,
        annotations: newAnnotations,
        updatedAt: new Date().toISOString(),
      },
    }));

    try {
      await fetch(`/tools/study-vault/api/pdfs/${currentTab.pdfEntry.id}/study-data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annotations: newAnnotations }),
      });
    } catch {}
  };

  const deletePdfSnip = async (snipId: string) => {
    if (!currentTab?.pdfEntry) return;
    const nextPdfSnips = (currentTab.pdfEntry.studyData?.snips || []).filter((s) => s.id !== snipId);
    patchPdfEntry(activeTab, (p) => ({
      ...p,
      studyData: { ...p.studyData, snips: nextPdfSnips },
    }));

    try {
      await fetch(`/tools/study-vault/api/pdfs/${currentTab.pdfEntry.id}/study-data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snips: nextPdfSnips }),
      });
    } catch {}

    if (currentSession?.id) {
      const nextSessionSnips = (currentSession.snips || []).filter((s) => s.id !== snipId);
      setCurrentSession((prev) => (prev ? { ...prev, snips: nextSessionSnips } : prev));
      try {
        await fetch(`/tools/study-vault/api/sessions/${currentSession.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snips: nextSessionSnips }),
        });
      } catch {}
    }
  };

  const updatePdfSnipNote = async (snipId: string, note: string) => {
    if (!currentTab?.pdfEntry) return;
    const nextPdfSnips = (currentTab.pdfEntry.studyData?.snips || []).map((s) =>
      s.id === snipId ? { ...s, note } : s
    );
    patchPdfEntry(activeTab, (p) => ({
      ...p,
      studyData: { ...p.studyData, snips: nextPdfSnips },
    }));

    try {
      await fetch(`/tools/study-vault/api/pdfs/${currentTab.pdfEntry.id}/study-data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snips: nextPdfSnips }),
      });
    } catch {}

    if (currentSession?.id) {
      const nextSessionSnips = (currentSession.snips || []).map((s) =>
        s.id === snipId ? { ...s, note } : s
      );
      setCurrentSession((prev) => (prev ? { ...prev, snips: nextSessionSnips } : prev));
      try {
        await fetch(`/tools/study-vault/api/sessions/${currentSession.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snips: nextSessionSnips }),
        });
      } catch {}
    }
  };

  const openNewTabModal = async () => {
    try {
      const res = await fetch("/tools/study-vault/api/pdfs");
      const list = await res.json();
      setAvailablePdfs(Array.isArray(list) ? list : []);
      setShowPdfPicker(true);
    } catch {}
  };

  const handleLinkLocalPdfInPicker = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pickerLocalPath.trim().replace(/^["']|["']$/g, "");
    if (!clean) return;
    setPickerUploading(true);
    try {
      const res = await fetch(`/tools/study-vault/api/pdfs/local`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localPath: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to link local PDF");
      setShowPdfPicker(false);
      setPickerLocalPath("");
      addTab({ pdfEntry: data, rotation: 0 });
    } catch (err: any) {
      toast.error(err.message || "Failed to link local PDF");
    } finally {
      setPickerUploading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Opening Study Mode…</p>
      </div>
    );
  }

  if (initError || !currentTab) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="max-w-md w-full p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <p className="text-red-400 text-sm font-semibold mb-3">{initError || "No active document tab"}</p>
          <Link
            href="/tools/study-vault"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
          >
            <ArrowLeft size={14} />
            <span>Back to Library</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-gray-100 overflow-hidden select-none">
      {/* Tab Bar Header */}
      <div className="flex items-center px-2 pt-1.5 bg-slate-900 border-b border-slate-800 shrink-0 gap-1 overflow-x-auto">
        <Link
          href="/tools/study-vault"
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition mr-1 shrink-0"
          title="Back to Study Library"
        >
          <ArrowLeft size={16} />
        </Link>

        {tabs.map((tab, idx) => {
          const isActive = idx === activeTab;
          return (
            <div
              key={tab.id || idx}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs cursor-pointer border-t border-x transition font-medium max-w-[200px] shrink-0 ${
                isActive
                  ? "bg-slate-950 border-slate-700 text-blue-400 shadow-sm"
                  : "bg-slate-900/60 border-transparent text-gray-400 hover:bg-slate-800 hover:text-gray-200"
              }`}
            >
              <FileText size={13} className={isActive ? "text-blue-400" : "text-gray-500"} />
              <span className="truncate flex-1">{tab.pdfEntry.originalName}</span>
              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(idx);
                  }}
                  className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={openNewTabModal}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition shrink-0 ml-1"
          title="Open another PDF tab"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Toolbar */}
      <StudyToolbar
        tool={currentTab.tool}
        setTool={(t) => patchTab(activeTab, { tool: t })}
        penColor={currentTab.penColor}
        setPenColor={(c) => patchTab(activeTab, { penColor: c })}
        highlightColor={currentTab.highlightColor}
        setHighlightColor={(c) => patchTab(activeTab, { highlightColor: c })}
        penSize={currentTab.penSize}
        setPenSize={(s) => patchTab(activeTab, { penSize: s })}
        currentPage={currentTab.currentPage}
        totalPages={currentTab.totalPages}
        onPageInput={(p) => rendererRef.current?.scrollToPage(p)}
        zoom={currentTab.scale}
        onZoomIn={() => patchTab(activeTab, { scale: Math.min(3.0, currentTab.scale + 0.15) })}
        onZoomOut={() => patchTab(activeTab, { scale: Math.max(0.4, currentTab.scale - 0.15) })}
        onZoomReset={() => patchTab(activeTab, { scale: 1.3 })}
        onZoomSet={(s) => patchTab(activeTab, { scale: s })}
        isDarkMode={true}
        snipCount={currentTab.pdfEntry.studyData?.snips?.length || 0}
        onToggleNASPanel={() => patchTab(activeTab, { nasPanelOpen: !currentTab.nasPanelOpen })}
        nasPanelOpen={currentTab.nasPanelOpen}
        pdfName={currentTab.pdfEntry.originalName}
        rotation={currentTab.rotation}
        onRotateCW={() => patchTab(activeTab, { rotation: (currentTab.rotation + 90) % 360 })}
        onRotateCCW={() => patchTab(activeTab, { rotation: (currentTab.rotation + 270) % 360 })}
        onUndo={() => rendererRef.current?.undo()}
        onRedo={() => rendererRef.current?.redo()}
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
        onClearPage={() => rendererRef.current?.clearCurrentPage()}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        elapsedStudyTime={elapsedStudyTime}
        timerRunning={timerRunning}
        onToggleTimer={() => setTimerRunning(!timerRunning)}
      />

      {/* Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Outline) */}
        {sidebarOpen && (
          <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-200">Outline & Bookmarks</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
              {docOutlines[currentTab.pdfEntry.id]?.length ? (
                docOutlines[currentTab.pdfEntry.id].map((item: any, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (item.dest) {
                        rendererRef.current?.scrollToPage(item.pageNumber || 1);
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-gray-300 transition truncate"
                  >
                    {item.title}
                  </button>
                ))
              ) : (
                <p className="p-4 text-center text-gray-500 text-xs">No outline available in this document</p>
              )}
            </div>
          </div>
        )}

        {/* Center PDF Renderer */}
        <div className="flex-1 flex overflow-hidden relative">
          <StudyPDFRenderer
            key={currentTab.pdfEntry.id}
            ref={rendererRef}
            pdfId={currentTab.pdfEntry.id}
            tool={currentTab.tool}
            penColor={currentTab.penColor}
            highlightColor={currentTab.highlightColor}
            penSize={currentTab.penSize}
            scale={currentTab.scale}
            rotation={currentTab.rotation}
            annotations={currentTab.pdfEntry.studyData?.annotations || []}
            onSnipComplete={(data) => {
              setSnipModal({ ...data, tabIdx: activeTab });
              setSnipNote("");
              setSnipCopied(false);
            }}
            onAnnotationsChange={handleAnnotationsChange}
            onTotalPages={(tot) => patchTab(activeTab, { totalPages: tot })}
            onPageChange={(p) => patchTab(activeTab, { currentPage: p })}
            onOutlineLoaded={(outline) => {
              setDocOutlines((prev) => ({ ...prev, [currentTab.pdfEntry.id]: outline }));
            }}
            onHistoryChange={setHistoryState}
            isDarkMode={true}
          />
        </div>

        {/* Right Snips & Notes Panel */}
        {currentTab.nasPanelOpen && (
          <div className="w-80 border-l border-slate-800 bg-slate-900 shrink-0 h-full">
            <NASPanel
              session={{
                id: currentSession?.id,
                title: currentTab.pdfEntry.originalName,
                pdfName: currentTab.pdfEntry.originalName,
                snips: currentTab.pdfEntry.studyData?.snips || [],
                updatedAt: currentTab.pdfEntry.studyData?.updatedAt,
              }}
              onClose={() => patchTab(activeTab, { nasPanelOpen: false })}
              onDeleteSnip={deletePdfSnip}
              onUpdateSnipNote={updatePdfSnipNote}
              onDownload={() =>
                exportStudySnipsPdf(
                  currentTab.pdfEntry.originalName,
                  currentTab.pdfEntry.studyData?.snips || []
                )
              }
              onJumpToPage={(p) => rendererRef.current?.scrollToPage(p)}
              isDarkMode={true}
            />
          </div>
        )}
      </div>

      {/* Snip Save Modal */}
      {snipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>✂️ New Snip Captured</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                  Page {snipModal.page}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setSnipModal(null)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-60 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center">
              <img
                src={snipModal.imageData}
                alt="Snip preview"
                className="max-h-60 w-auto object-contain"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Note / Key Findings:
              </label>
              <textarea
                autoFocus
                rows={2}
                value={snipNote}
                onChange={(e) => setSnipNote(e.target.value)}
                placeholder="Add notes for this snippet… (optional)"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={copySnipImage}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded-xl text-xs font-semibold transition"
              >
                {snipCopied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                <span>{snipCopied ? "Copied" : "Copy Image"}</span>
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setSnipModal(null)}
                className="px-4 py-2 bg-slate-800 text-gray-300 hover:bg-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSnip}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Save Snip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Picker Modal for Opening Additional Tabs */}
      {showPdfPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Open Document Tab</h3>
              <button
                type="button"
                onClick={() => setShowPdfPicker(false)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Link Local Path */}
            <form onSubmit={handleLinkLocalPdfInPicker} className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <HardDrive size={13} className="text-blue-400" />
                <span>Link Local PDF Path:</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pickerLocalPath}
                  onChange={(e) => setPickerLocalPath(e.target.value)}
                  placeholder="e.g. C:\Books\Calculus.pdf"
                  className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={pickerUploading || !pickerLocalPath.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold"
                >
                  {pickerUploading ? <Loader2 size={13} className="animate-spin" /> : "Open"}
                </button>
              </div>
            </form>

            <div className="border-t border-slate-800 pt-3">
              <p className="text-xs font-semibold text-gray-400 mb-2">Or select from Library:</p>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {availablePdfs.map((pdf) => (
                  <button
                    key={pdf.id}
                    type="button"
                    onClick={() => {
                      setShowPdfPicker(false);
                      addTab({ pdfEntry: pdf, rotation: 0 });
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-medium text-gray-200 flex items-center justify-between transition"
                  >
                    <span className="truncate">{pdf.originalName}</span>
                    <span className="text-[10px] text-gray-500 font-mono ml-2 shrink-0">
                      {pdf.storageType === "local" ? "Local" : "Cloud"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
