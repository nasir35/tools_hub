"use client";

import { useRef, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import {
  ScanLine,
  ImagePlus,
  FileScan,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sliders,
  Settings2,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { usePdfScanner } from "./hooks/usePdfScanner";
import DropZone from "./components/DropZone";
import PageThumbnail from "./components/PageThumbnail";
import FilterPanel from "./components/FilterPanel";
import PdfSettingsPanel from "./components/PdfSettingsPanel";
import { useState } from "react";

type RightPanel = "filters" | "settings";

export default function PdfScannerPage() {
  const scanner = usePdfScanner();
  const addMoreRef = useRef<HTMLInputElement>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>("filters");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = scanner.pages.findIndex((p) => p.id === active.id);
        const newIndex = scanner.pages.findIndex((p) => p.id === over.id);
        scanner.reorderPages(arrayMove(scanner.pages, oldIndex, newIndex));
      }
    },
    [scanner]
  );

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      scanner.addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleGenerate = async () => {
    if (scanner.pages.length === 0) {
      toast.error("Please add at least one image first.");
      return;
    }
    try {
      await scanner.generatePdf();
      toast.success("PDF downloaded successfully!");
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const hasPages = scanner.pages.length > 0;

  return (
    <div className="flex flex-col h-full gap-0 pb-8">
      {/* ── HEADER ── */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
        {/* Ambient blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-violet-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
            <FileScan className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              PDF Scanner
              <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 tracking-wide uppercase">
                CamScan
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Upload images, enhance them, and export a polished PDF.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          {hasPages && (
            <>
              <input
                ref={addMoreRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAddMore}
              />
              <button
                onClick={() => addMoreRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm border border-slate-200 dark:border-slate-700 transition-all"
              >
                <ImagePlus className="w-4 h-4" />
                Add More
              </button>
            </>
          )}
          <button
            onClick={handleGenerate}
            disabled={!hasPages || scanner.isGenerating}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
              !hasPages || scanner.isGenerating
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-100"
            }`}
          >
            <ScanLine className="w-4 h-4" />
            {scanner.isGenerating ? "Generating…" : `Export PDF (${scanner.pages.length})`}
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      {!hasPages ? (
        /* Empty state — full drop zone */
        <div className="flex-1">
          <DropZone onFilesAdded={scanner.addFiles} isProcessing={scanner.isProcessing} />

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            {[
              "✨ Auto-enhance",
              "🎨 4 Filters",
              "🔄 Rotation",
              "📋 Drag to Reorder",
              "⬇️ One-Click PDF",
              "📐 A4 / Letter / A3",
            ].map((feat) => (
              <span
                key={feat}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-sm text-slate-600 dark:text-slate-400 font-medium shadow-sm"
              >
                {feat}
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* Editor layout */
        <div className="flex gap-4 min-h-0 flex-1">
          {/* ── LEFT: Page grid ── */}
          <div className="flex-1 flex flex-col min-w-0 gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Layers className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {scanner.pages.length} page{scanner.pages.length !== 1 ? "s" : ""}
                </span>
                {scanner.selectedPage && (
                  <span className="text-slate-400 dark:text-slate-600 text-sm">
                    · Editing page {scanner.pages.findIndex((p) => p.id === scanner.selectedId) + 1}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setRightPanel("filters"); setSidebarOpen(true); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sidebarOpen && rightPanel === "filters"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Filters
                </button>
                <button
                  onClick={() => { setRightPanel("settings"); setSidebarOpen(true); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sidebarOpen && rightPanel === "settings"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  PDF Settings
                </button>
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  title={sidebarOpen ? "Hide panel" : "Show panel"}
                >
                  {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Page Grid */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={scanner.pages.map((p) => p.id)}
                  strategy={rectSortingStrategy}
                >
                  <AnimatePresence>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {scanner.pages.map((page, index) => (
                        <PageThumbnail
                          key={page.id}
                          page={page}
                          index={index}
                          isSelected={scanner.selectedId === page.id}
                          onSelect={scanner.setSelectedId}
                          onDelete={scanner.deletePage}
                          onRotate={scanner.rotatePage}
                        />
                      ))}

                      {/* Add More Card */}
                      <motion.label
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all"
                        style={{ aspectRatio: "3/4" }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleAddMore}
                        />
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <ImagePlus className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-slate-400 font-medium text-center px-2">
                          Add page
                        </span>
                      </motion.label>
                    </div>
                  </AnimatePresence>
                </SortableContext>
              </DndContext>
            </div>

            {/* Processing indicator */}
            <AnimatePresence>
              {scanner.isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-3 flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-t-blue-500 border-blue-200 animate-spin shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Processing new images…
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT: Panel ── */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                key="sidebar"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="w-72 shrink-0 flex flex-col gap-4"
              >
                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 overflow-y-auto">
                  {/* Panel Tabs */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                      <button
                        onClick={() => setRightPanel("filters")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          rightPanel === "filters"
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <Sliders className="w-3 h-3" />
                        Filters
                      </button>
                      <button
                        onClick={() => setRightPanel("settings")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          rightPanel === "settings"
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <Settings2 className="w-3 h-3" />
                        PDF
                      </button>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {rightPanel === "filters" ? (
                    scanner.selectedPage ? (
                      <FilterPanel
                        page={scanner.selectedPage}
                        onUpdate={scanner.updatePage}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                          <Sliders className="w-7 h-7" />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Select a page to apply filters
                        </p>
                      </div>
                    )
                  ) : (
                    <PdfSettingsPanel
                      pageCount={scanner.pages.length}
                      fileName={scanner.fileName}
                      paperSize={scanner.paperSize}
                      orientation={scanner.orientation}
                      margin={scanner.margin}
                      isGenerating={scanner.isGenerating}
                      onFileNameChange={scanner.setFileName}
                      onPaperSizeChange={scanner.setPaperSize}
                      onOrientationChange={scanner.setOrientation}
                      onMarginChange={scanner.setMargin}
                      onGenerate={handleGenerate}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: "14px",
            fontWeight: 600,
            fontSize: "14px",
          },
        }}
      />
    </div>
  );
}
