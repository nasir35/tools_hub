"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import { AlertTriangle, HardDrive, RefreshCw, Check } from "lucide-react";
import { Annotation } from "../utils/types";

// Helper: Convert point to normalized coordinates (0.0 to 1.0)
const toNorm = (pos: { x: number; y: number }, width: number, height: number) => ({
  xn: Math.max(0, Math.min(1, pos.x / (width || 1))),
  yn: Math.max(0, Math.min(1, pos.y / (height || 1))),
});

// Helper: Resolve normalized or legacy point to current canvas coordinates
const resolvePoint = (
  pt: any,
  curWidth: number,
  curHeight: number,
  baseW = 800,
  baseH = 1000
) => {
  if (pt.xn !== undefined && pt.yn !== undefined) {
    return { x: pt.xn * curWidth, y: pt.yn * curHeight };
  }
  if (pt.x !== undefined && pt.y !== undefined) {
    const normX = pt.x > 1.5 ? pt.x / (baseW || 800) : pt.x;
    const normY = pt.y > 1.5 ? pt.y / (baseH || 1000) : pt.y;
    return { x: normX * curWidth, y: normY * curHeight };
  }
  return { x: 0, y: 0 };
};

export interface StudyPDFRendererRef {
  scrollToPage: (p: number) => void;
  getCurrentPage: () => number;
  undo: () => void;
  redo: () => void;
  clearCurrentPage: () => void;
  getPdfDocument: () => any;
}

interface PDFPageProps {
  page: any;
  pageNum: number;
  totalPages: number;
  pdfId: string;
  scale: number;
  rotation: number;
  tool: string;
  penColor: string;
  penSize: number;
  onSnipComplete?: (snip: { imageData: string; page: number; rect: any }) => void;
  onAnnotationsChange?: () => void;
  strokesRef: React.MutableRefObject<Record<number, any[]>>;
  isDarkMode?: boolean;
  onPageVisible?: (pageNum: number) => void;
}

const PDFPage = forwardRef<any, PDFPageProps>(({
  page,
  pageNum,
  totalPages,
  pdfId,
  scale,
  rotation,
  tool,
  penColor,
  penSize,
  onSnipComplete,
  onAnnotationsChange,
  strokesRef,
  isDarkMode,
  onPageVisible,
}, ref) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const annoCanvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const renderTaskRef = useRef<any>(null);
  const textLayerRenderTaskRef = useRef<any>(null);

  const vp = page.getViewport({ scale, rotation });

  const redrawStrokes = useCallback(() => {
    const ac = annoCanvasRef.current;
    if (!ac) return;
    const outputScale = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const ctx = ac.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ac.width, ac.height);

    const strokes = strokesRef.current[pageNum] || [];
    if (!strokes.length) return;

    ctx.save();
    ctx.scale(outputScale, outputScale);

    const vpWidth = vp.width;
    const vpHeight = vp.height;
    const zoomFactor = vpWidth / 800;

    strokes.forEach((stroke: any) => {
      if (!stroke.points || stroke.points.length === 0) return;
      ctx.save();

      const effectiveSize = Math.max(1, (stroke.size || 3) * zoomFactor);

      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = effectiveSize * 5;
        ctx.globalAlpha = 1;
      } else if (stroke.tool === "highlight") {
        ctx.globalCompositeOperation = "multiply";
        ctx.strokeStyle = stroke.color || "#fbbf24";
        ctx.lineWidth = effectiveSize * 5;
        ctx.globalAlpha = 0.45;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color || "#1e1e1e";
        ctx.lineWidth = effectiveSize;
        ctx.globalAlpha = 1;
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();

      const startPt = resolvePoint(stroke.points[0], vpWidth, vpHeight, stroke.baseWidth, stroke.baseHeight);
      ctx.moveTo(startPt.x, startPt.y);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = resolvePoint(stroke.points[i], vpWidth, vpHeight, stroke.baseWidth, stroke.baseHeight);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();
  }, [pageNum, strokesRef, vp.width, vp.height]);

  useImperativeHandle(ref, () => ({
    getPdfCanvas: () => pdfCanvasRef.current,
    getAnnoCanvas: () => annoCanvasRef.current,
    getWrapper: () => wrapperRef.current,
    redrawStrokes,
  }));

  // Lazy render
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setRendered(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRendered(true);
          obs.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // PDF & Text Layer rendering
  useEffect(() => {
    if (!rendered) return;
    const canvas = pdfCanvasRef.current;
    if (!canvas) return;

    const outputScale = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const vp2 = page.getViewport({ scale, rotation });

    canvas.width = Math.floor(vp2.width * outputScale);
    canvas.height = Math.floor(vp2.height * outputScale);
    canvas.style.width = Math.floor(vp2.width) + "px";
    canvas.style.height = Math.floor(vp2.height) + "px";

    const ctx = canvas.getContext("2d");
    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    renderTaskRef.current?.cancel();
    renderTaskRef.current = page.render({
      canvasContext: ctx,
      viewport: vp2,
      transform: transform,
    });
    renderTaskRef.current.promise.catch(() => {});

    const ac = annoCanvasRef.current;
    if (ac) {
      ac.width = Math.floor(vp2.width * outputScale);
      ac.height = Math.floor(vp2.height * outputScale);
      ac.style.width = Math.floor(vp2.width) + "px";
      ac.style.height = Math.floor(vp2.height) + "px";
      redrawStrokes();
    }

    const textLayerDiv = textLayerRef.current;
    if (textLayerDiv) {
      textLayerDiv.innerHTML = "";
      textLayerDiv.style.width = Math.floor(vp2.width) + "px";
      textLayerDiv.style.height = Math.floor(vp2.height) + "px";

      page.getTextContent().then((textContent: any) => {
        if (!textLayerRef.current) return;
        textLayerRenderTaskRef.current?.cancel?.();
        try {
          textLayerRenderTaskRef.current = (pdfjsLib as any).renderTextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: vp2,
            textDivs: [],
          });
        } catch {}
      }).catch(() => {});
    }

    return () => {
      renderTaskRef.current?.cancel();
    };
  }, [rendered, page, scale, rotation, redrawStrokes]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onPageVisible?.(pageNum);
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pageNum, onPageVisible]);

  const getLogicalPos = useCallback((e: any, canvas: HTMLCanvasElement) => {
    const r = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (cx - r.left) * (vp.width / r.width),
      y: (cy - r.top) * (vp.height / r.height),
    };
  }, [vp.width, vp.height]);

  const getWrapperPos = useCallback((e: any, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - r.left, y: cy - r.top };
  }, []);

  const drawActive = useRef(false);
  const drawCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const currentStroke = useRef<any>(null);
  const snipState = useRef<{
    active: boolean;
    startX?: number;
    startY?: number;
    overlay?: HTMLDivElement;
    wrapper?: HTMLElement;
    rect?: { l: number; t: number; w: number; h: number } | null;
  }>({ active: false });

  const strokeErase = useCallback((pos: { x: number; y: number }) => {
    const strokes = strokesRef.current[pageNum] || [];
    const THRESH = 16 * (vp.width / 800);
    const remaining = strokes.filter((stroke) => {
      return !stroke.points.some((pt: any) => {
        const p = resolvePoint(pt, vp.width, vp.height, stroke.baseWidth, stroke.baseHeight);
        return Math.hypot(p.x - pos.x, p.y - pos.y) < THRESH;
      });
    });

    if (remaining.length !== strokes.length) {
      strokesRef.current[pageNum] = remaining;
      redrawStrokes();
      onAnnotationsChange?.();
    }
  }, [pageNum, strokesRef, redrawStrokes, onAnnotationsChange, vp.width, vp.height]);

  const handleMouseDown = useCallback((e: any) => {
    if (tool === "select") return;

    if (tool === "snip") {
      e.preventDefault();
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const pos = getWrapperPos(e, wrapper);
      const overlay = document.createElement("div");
      overlay.style.cssText =
        "position:absolute;z-index:999;pointer-events:none;border:2px dashed #2563eb;background:rgba(37,99,235,0.08);box-shadow:0 0 0 9999px rgba(0,0,0,0.25);border-radius:4px;";
      wrapper.appendChild(overlay);
      Object.assign(overlay.style, { left: pos.x + "px", top: pos.y + "px", width: "0px", height: "0px" });
      snipState.current = { active: true, startX: pos.x, startY: pos.y, overlay, wrapper, rect: null };
      return;
    }

    const ac = annoCanvasRef.current;
    if (!["pen", "eraser", "highlight", "stroke-eraser"].includes(tool) || !ac) return;
    e.preventDefault();

    if (tool === "stroke-eraser") {
      drawActive.current = true;
      strokeErase(getLogicalPos(e, ac));
      return;
    }

    drawActive.current = true;
    const pos = getLogicalPos(e, ac);
    const norm = toNorm(pos, vp.width, vp.height);
    const outputScale = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const ctx = ac.getContext("2d");
    if (!ctx) return;

    currentStroke.current = {
      id: Date.now().toString() + "_" + Math.random().toString(36).substr(2, 5),
      tool,
      color: penColor,
      size: penSize,
      baseWidth: vp.width,
      baseHeight: vp.height,
      points: [{ ...norm, x: pos.x, y: pos.y }],
      page: pageNum,
      createdAt: new Date().toISOString(),
    };

    if (!strokesRef.current[pageNum]) strokesRef.current[pageNum] = [];

    ctx.save();
    ctx.scale(outputScale, outputScale);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    const zoomFactor = vp.width / 800;
    const effectiveSize = Math.max(1, penSize * zoomFactor);

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = effectiveSize * 5;
      ctx.globalAlpha = 1;
    } else if (tool === "highlight") {
      ctx.globalCompositeOperation = "multiply";
      ctx.strokeStyle = penColor;
      ctx.lineWidth = effectiveSize * 5;
      ctx.globalAlpha = 0.45;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = penColor;
      ctx.lineWidth = effectiveSize;
      ctx.globalAlpha = 1;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    drawCtxRef.current = ctx;
  }, [tool, penColor, penSize, pageNum, strokesRef, strokeErase, vp.width, vp.height, getLogicalPos, getWrapperPos]);

  useEffect(() => {
    const onMove = (e: any) => {
      const s = snipState.current;
      if (s.active && s.overlay && s.wrapper && s.startX !== undefined && s.startY !== undefined) {
        e.preventDefault?.();
        const pos = getWrapperPos(e, s.wrapper);
        const l = Math.min(pos.x, s.startX), t = Math.min(pos.y, s.startY);
        const w = Math.abs(pos.x - s.startX), h = Math.abs(pos.y - s.startY);
        Object.assign(s.overlay.style, { left: l + "px", top: t + "px", width: w + "px", height: h + "px" });
        s.rect = { l, t, w, h };
        return;
      }

      if (!drawActive.current) return;
      const ac = annoCanvasRef.current;
      if (!ac) return;
      e.preventDefault?.();
      const pos = getLogicalPos(e, ac);

      if (tool === "stroke-eraser") {
        strokeErase(pos);
        return;
      }

      const ctx = drawCtxRef.current;
      if (!ctx) return;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      if (currentStroke.current) {
        const norm = toNorm(pos, vp.width, vp.height);
        currentStroke.current.points.push({ ...norm, x: pos.x, y: pos.y });
      }
    };

    const onUp = () => {
      if (drawActive.current && drawCtxRef.current) {
        drawCtxRef.current.restore?.();
        drawCtxRef.current = null;
        if (currentStroke.current && ["pen", "highlight", "eraser"].includes(currentStroke.current.tool)) {
          if (!strokesRef.current[pageNum]) strokesRef.current[pageNum] = [];
          strokesRef.current[pageNum].push(currentStroke.current);
          onAnnotationsChange?.();
        }
        currentStroke.current = null;
      }
      drawActive.current = false;

      // Finish snip
      const s = snipState.current;
      if (!s.active) return;
      s.active = false;
      s.overlay?.remove();
      const r = s.rect;
      snipState.current = { active: false };
      if (!r || r.w < 10 || r.h < 10) return;

      const pdfC = pdfCanvasRef.current;
      const wrapper = wrapperRef.current;
      if (!pdfC || !wrapper) return;
      const cssW = wrapper.offsetWidth, cssH = wrapper.offsetHeight;
      const sx = pdfC.width / cssW, sy = pdfC.height / cssH;
      const cx = r.l * sx, cy = r.t * sy, cw = r.w * sx, ch = r.h * sy;

      const out = document.createElement("canvas");
      out.width = Math.max(1, Math.round(cw));
      out.height = Math.max(1, Math.round(ch));
      const ctx = out.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(pdfC, cx, cy, cw, ch, 0, 0, cw, ch);
      const ac = annoCanvasRef.current;
      if (ac) ctx.drawImage(ac, cx, cy, cw, ch, 0, 0, cw, ch);

      const normRect = {
        xn: r.l / cssW,
        yn: r.t / cssH,
        wn: r.w / cssW,
        hn: r.h / cssH,
      };

      onSnipComplete?.({
        imageData: out.toDataURL("image/png"),
        page: pageNum,
        rect: normRect,
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [tool, pageNum, strokesRef, strokeErase, onAnnotationsChange, onSnipComplete, vp.width, vp.height, getLogicalPos, getWrapperPos]);

  const cursorMap: Record<string, string> = {
    snip: "crosshair",
    pen: "crosshair",
    highlight: "crosshair",
    eraser: "cell",
    "stroke-eraser": "pointer",
    select: "text",
  };

  return (
    <div
      ref={wrapperRef}
      id={`sp-${pdfId}-${pageNum}`}
      data-page={pageNum}
      className="relative shadow-xl flex-shrink-0 transition-shadow select-text"
      style={{
        width: Math.floor(vp.width),
        maxWidth: "calc(100vw - 2rem)",
        background: "white",
        cursor: cursorMap[tool] || "default",
        minHeight: Math.floor(vp.height),
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {rendered ? (
        <>
          <canvas
            ref={pdfCanvasRef}
            style={{ display: "block", width: Math.floor(vp.width) + "px", height: Math.floor(vp.height) + "px" }}
          />
          <div ref={textLayerRef} className="textLayer" />
          <canvas
            ref={annoCanvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              display: "block",
              pointerEvents: tool === "select" ? "none" : "auto",
              zIndex: 3,
            }}
          />
        </>
      ) : (
        <div
          className="flex items-center justify-center text-xs text-gray-400 font-mono"
          style={{ width: Math.floor(vp.width), height: Math.floor(vp.height) }}
        >
          Page {pageNum}
        </div>
      )}
    </div>
  );
});

PDFPage.displayName = "PDFPage";

// ─── Main StudyPDFRenderer Component ─────────────────────────────────────────
export interface StudyPDFRendererProps {
  pdfId: string;
  tool?: string;
  penColor?: string;
  highlightColor?: string;
  penSize?: number;
  scale?: number;
  rotation?: number;
  annotations?: Annotation[];
  onSnipComplete?: (snip: { imageData: string; page: number; rect: any }) => void;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  onTotalPages?: (totalPages: number) => void;
  onPageChange?: (page: number) => void;
  onOutlineLoaded?: (outline: any[]) => void;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  isDarkMode?: boolean;
}

export const StudyPDFRenderer = forwardRef<StudyPDFRendererRef, StudyPDFRendererProps>(({
  pdfId,
  tool = "select",
  penColor = "#1e1e1e",
  highlightColor = "#fbbf24",
  penSize = 3,
  scale = 1.3,
  rotation = 0,
  annotations = [],
  onSnipComplete,
  onAnnotationsChange,
  onTotalPages,
  onPageChange,
  onOutlineLoaded,
  onHistoryChange,
  isDarkMode = false,
}, ref) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingFileInfo, setMissingFileInfo] = useState<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  // Relink state
  const [newLocalPath, setNewLocalPath] = useState("");
  const [relinking, setRelinking] = useState(false);
  const [relinkError, setRelinkError] = useState("");

  const strokesRef = useRef<Record<number, any[]>>({});
  const pageRefs = useRef<Record<number, any>>({});
  const undoStack = useRef<any[]>([]);
  const redoStack = useRef<any[]>([]);
  const curPage = useRef(1);

  // Setup worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
    }
  }, []);

  const notifyHistory = useCallback(() => {
    onHistoryChange?.({
      canUndo: undoStack.current.length > 0,
      canRedo: redoStack.current.length > 0,
    });
  }, [onHistoryChange]);

  const handleRelink = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newLocalPath.trim().replace(/^["']|["']$/g, "");
    if (!clean) return;

    setRelinking(true);
    setRelinkError("");
    try {
      const res = await fetch(`/tools/study-vault/api/pdfs/${pdfId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localPath: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to update file path");
      }
      setMissingFileInfo(null);
      setError(null);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setRelinkError(err.message || "Failed to relink document");
    } finally {
      setRelinking(false);
    }
  };

  // Fetch and parse PDF document
  useEffect(() => {
    if (!pdfId) return;
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setMissingFileInfo(null);
    setPdfDoc(null);
    setNumPages(0);
    strokesRef.current = {};
    pageRefs.current = {};
    undoStack.current = [];
    redoStack.current = [];
    notifyHistory();

    (async () => {
      try {
        const res = await fetch(`/tools/study-vault/api/pdfs/${pdfId}/file`);
        if (!res.ok) {
          let errData = null;
          try {
            errData = await res.json();
          } catch {}
          if (errData && errData.error === "LOCAL_FILE_NOT_FOUND") {
            setMissingFileInfo(errData);
            throw new Error(errData.message || "Local PDF file was not found at the saved path");
          }
          throw new Error(`Failed to load document file (HTTP ${res.status})`);
        }
        const arrayBuffer = await res.arrayBuffer();
        if (isCancelled) return;

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        onTotalPages?.(doc.numPages);
        setLoading(false);

        try {
          const outline = await doc.getOutline();
          if (outline && outline.length > 0 && !isCancelled) {
            onOutlineLoaded?.(outline);
          }
        } catch {}
      } catch (err: any) {
        if (isCancelled) return;
        if (err.name === "RenderingCancelledException" || err.message?.includes("Worker was destroyed")) {
          return;
        }
        console.error("PDF load error:", err);
        setError(err.message || "Failed to load document");
        setLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [pdfId, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync annotations into strokesRef
  useEffect(() => {
    const grouped: Record<number, any[]> = {};
    for (const item of annotations || []) {
      const p = item.page || 1;
      if (!grouped[p]) grouped[p] = [];
      grouped[p].push(item);
    }
    strokesRef.current = grouped;
    Object.values(pageRefs.current).forEach((r) => r?.redrawStrokes?.());
  }, [annotations]);

  const emitAnnotationsChange = useCallback(() => {
    undoStack.current.push(JSON.parse(JSON.stringify(strokesRef.current)));
    redoStack.current = [];
    notifyHistory();

    if (!onAnnotationsChange) return;
    const next = Object.entries(strokesRef.current)
      .flatMap(([page, items]) => (items || []).map((item) => ({ ...item, page: Number(page) })))
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    onAnnotationsChange(next as Annotation[]);
  }, [onAnnotationsChange, notifyHistory]);

  const handleUndo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const currentState = JSON.parse(JSON.stringify(strokesRef.current));
    redoStack.current.push(currentState);
    const prevState = undoStack.current.pop();
    strokesRef.current = prevState || {};
    Object.values(pageRefs.current).forEach((r) => r?.redrawStrokes?.());
    notifyHistory();

    const next = Object.entries(strokesRef.current)
      .flatMap(([page, items]) => (items || []).map((item) => ({ ...item, page: Number(page) })))
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    onAnnotationsChange?.(next as Annotation[]);
  }, [notifyHistory, onAnnotationsChange]);

  const handleRedo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const nextState = redoStack.current.pop();
    undoStack.current.push(JSON.parse(JSON.stringify(strokesRef.current)));
    strokesRef.current = nextState || {};
    Object.values(pageRefs.current).forEach((r) => r?.redrawStrokes?.());
    notifyHistory();

    const next = Object.entries(strokesRef.current)
      .flatMap(([page, items]) => (items || []).map((item) => ({ ...item, page: Number(page) })))
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    onAnnotationsChange?.(next as Annotation[]);
  }, [notifyHistory, onAnnotationsChange]);

  const handleClearCurrentPage = useCallback(() => {
    const page = curPage.current;
    if (!strokesRef.current[page] || strokesRef.current[page].length === 0) return;
    undoStack.current.push(JSON.parse(JSON.stringify(strokesRef.current)));
    redoStack.current = [];
    strokesRef.current[page] = [];
    pageRefs.current[page]?.redrawStrokes?.();
    notifyHistory();

    const next = Object.entries(strokesRef.current)
      .flatMap(([p, items]) => (items || []).map((item) => ({ ...item, page: Number(p) })))
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    onAnnotationsChange?.(next as Annotation[]);
  }, [notifyHistory, onAnnotationsChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  useImperativeHandle(ref, () => ({
    scrollToPage: (p: number) => {
      const target = document.getElementById(`sp-${pdfId}-${p}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    getCurrentPage: () => curPage.current,
    undo: handleUndo,
    redo: handleRedo,
    clearCurrentPage: handleClearCurrentPage,
    getPdfDocument: () => pdfDoc,
  }));

  const handlePageVisible = useCallback(
    (p: number) => {
      if (p !== curPage.current) {
        curPage.current = p;
        onPageChange?.(p);
      }
    },
    [onPageChange]
  );

  const pageCache = useRef<Record<number, any>>({});
  const [pageObjects, setPageObjects] = useState<Record<number, any>>({});

  useEffect(() => {
    if (!pdfDoc) return;
    const prefetch = async () => {
      const toFetch = Math.min(3, pdfDoc.numPages);
      const updates: Record<number, any> = {};
      for (let i = 1; i <= toFetch; i++) {
        if (!pageCache.current[i]) {
          pageCache.current[i] = await pdfDoc.getPage(i);
        }
        updates[i] = pageCache.current[i];
      }
      setPageObjects((prev) => ({ ...prev, ...updates }));
    };
    prefetch();
  }, [pdfDoc]);

  const ensurePage = useCallback(
    async (pageNum: number) => {
      if (pageCache.current[pageNum]) return;
      if (!pdfDoc) return;
      pageCache.current[pageNum] = await pdfDoc.getPage(pageNum);
      setPageObjects((prev) => ({ ...prev, [pageNum]: pageCache.current[pageNum] }));
    },
    [pdfDoc]
  );

  if (loading) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center gap-4 ${
          isDarkMode ? "bg-slate-950 text-gray-300" : "bg-gray-100 text-gray-700"
        }`}
      >
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Preparing PDF document…</p>
      </div>
    );
  }

  if (error) {
    if (missingFileInfo) {
      return (
        <div
          className={`flex-1 flex flex-col items-center justify-center p-6 ${
            isDarkMode ? "bg-slate-950 text-gray-200" : "bg-gray-50 text-gray-800"
          }`}
        >
          <div
            className={`max-w-md w-full p-6 rounded-2xl border shadow-xl flex flex-col items-center text-center ${
              isDarkMode ? "bg-slate-900 border-amber-500/30" : "bg-white border-amber-300"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold mb-1">Local PDF File Not Found</h3>
            <p className={`text-xs mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              The document was not found at its saved location. It may have been moved, renamed, or the drive was disconnected.
            </p>

            <div
              className={`w-full p-3 rounded-xl mb-4 text-left border ${
                isDarkMode ? "bg-slate-950/80 border-slate-800 text-gray-300" : "bg-gray-100 border-gray-200 text-gray-700"
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-500 mb-1">
                <HardDrive size={13} />
                <span>Saved Path</span>
              </div>
              <p className="text-xs font-mono break-all select-all">
                {missingFileInfo.savedPath || "Unknown path"}
              </p>
            </div>

            <form onSubmit={handleRelink} className="w-full space-y-3">
              <div className="text-left">
                <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Relink to New Path:
                </label>
                <input
                  type="text"
                  value={newLocalPath}
                  onChange={(e) => {
                    setNewLocalPath(e.target.value);
                    if (relinkError) setRelinkError("");
                  }}
                  placeholder="e.g. C:\Users\name\Documents\document.pdf"
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              {relinkError && (
                <p className="text-xs text-red-400 text-left font-medium">{relinkError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={relinking || !newLocalPath.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  {relinking ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Verifying & Relinking…</span>
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      <span>Update Path & Open</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center gap-3 p-6 ${
          isDarkMode ? "bg-slate-950 text-gray-300" : "bg-gray-100 text-gray-700"
        }`}
      >
        <span className="text-5xl">⚠️</span>
        <p className="text-red-400 text-sm font-medium text-center max-w-xs">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 overflow-auto select-none ${isDarkMode ? "bg-[#0b0f17]" : "bg-slate-200/80"}`}
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: isDarkMode ? "#334155 #0b0f17" : "#94a3b8 #e2e8f0",
      }}
    >
      <style>{`
        .textLayer {
          position: absolute;
          text-align: initial;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          opacity: 0.25;
          line-height: 1;
          transform-origin: 0 0;
          z-index: 2;
        }
        .textLayer ::selection {
          background: rgba(37, 99, 235, 0.45);
        }
        .textLayer > span {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
      `}</style>
      <div className="flex flex-col items-center py-6 gap-6 min-w-max">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => {
          const pageObj = pageObjects[p];
          if (!pageObj) {
            ensurePage(p);
            return (
              <div
                key={p}
                id={`sp-${pdfId}-${p}`}
                data-page={p}
                className={`flex items-center justify-center rounded-lg border shadow-sm font-mono text-xs ${
                  isDarkMode ? "bg-slate-900 border-slate-800 text-gray-500" : "bg-white border-gray-200 text-gray-400"
                }`}
                style={{ width: Math.floor(600 * scale), height: Math.floor(800 * scale) }}
              >
                Page {p}
              </div>
            );
          }
          return (
            <PDFPage
              key={`${p}-${rotation}`}
              ref={(r) => {
                if (r) pageRefs.current[p] = r;
              }}
              page={pageObj}
              pageNum={p}
              totalPages={numPages}
              pdfId={pdfId}
              scale={scale}
              rotation={rotation}
              tool={tool}
              penColor={tool === "highlight" ? highlightColor : penColor}
              penSize={penSize}
              onSnipComplete={onSnipComplete}
              onAnnotationsChange={emitAnnotationsChange}
              strokesRef={strokesRef}
              isDarkMode={isDarkMode}
              onPageVisible={handlePageVisible}
            />
          );
        })}
      </div>
    </div>
  );
});

StudyPDFRenderer.displayName = "StudyPDFRenderer";

export default StudyPDFRenderer;
