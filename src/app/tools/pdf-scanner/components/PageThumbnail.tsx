"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  Trash2,
  RotateCcw,
  RotateCw,
  GripVertical,
  Check,
} from "lucide-react";
import { ScannedPage } from "../hooks/usePdfScanner";

interface PageThumbnailProps {
  page: ScannedPage;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRotate: (id: string, direction: "cw" | "ccw") => void;
}

export default function PageThumbnail({
  page,
  index,
  isSelected,
  onSelect,
  onDelete,
  onRotate,
}: PageThumbnailProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className={`
        group relative flex flex-col rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200
        ${isSelected
          ? "border-blue-500 shadow-lg shadow-blue-500/20"
          : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500"
        }
        bg-white dark:bg-slate-900
      `}
      onClick={() => onSelect(page.id)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Page Number Badge */}
      <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-slate-800/70 text-white text-xs font-bold flex items-center justify-center">
        {index + 1}
      </div>

      {/* Selected Checkmark */}
      {isSelected && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
          <Check className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Thumbnail Image */}
      <div className="relative bg-slate-100 dark:bg-slate-800 overflow-hidden" style={{ aspectRatio: "3/4" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={page.processedDataUrl}
          alt={`Page ${index + 1}`}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 dark:bg-slate-800/80">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[70px]">
          p.{index + 1}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onRotate(page.id, "ccw"); }}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            title="Rotate CCW"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRotate(page.id, "cw"); }}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            title="Rotate CW"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
            className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
            title="Delete page"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
