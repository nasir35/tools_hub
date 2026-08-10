"use client";

import { useState, useCallback, useRef } from "react";
import { jsPDF } from "jspdf";
import imageCompression from "browser-image-compression";

export type FilterType = "original" | "grayscale" | "blackwhite" | "magic";

export interface ScannedPage {
  id: string;
  originalDataUrl: string;
  processedDataUrl: string;
  filter: FilterType;
  rotation: number; // 0, 90, 180, 270
  brightness: number; // 0 to 200, default 100
  contrast: number; // 0 to 200, default 100
  fileName: string;
}

export type PaperSize = "a4" | "letter" | "a3";
export type Orientation = "portrait" | "landscape";

const PAPER_DIMS: Record<PaperSize, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  a3: [841.89, 1190.55],
};

function applyFilterToCanvas(
  img: HTMLImageElement,
  filter: FilterType,
  brightness: number,
  contrast: number,
  rotation: number
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const rad = (rotation * Math.PI) / 180;
  const isRotated90or270 = rotation === 90 || rotation === 270;

  if (isRotated90or270) {
    canvas.width = img.naturalHeight;
    canvas.height = img.naturalWidth;
  } else {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();

  // Apply brightness/contrast filter via CSS filter string (fastest approach)
  const bVal = brightness / 100;
  const cVal = contrast / 100;
  ctx.filter = `brightness(${bVal}) contrast(${cVal})`;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";

  if (filter === "original") {
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;

    if (filter === "grayscale") {
      data[i] = data[i + 1] = data[i + 2] = luma;
    } else if (filter === "blackwhite") {
      const bw = luma > 128 ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = bw;
    } else if (filter === "magic") {
      // Magic color: boost saturation, sharpen whites
      const gray = luma;
      const factor = 1.4;
      data[i] = Math.min(255, gray + (r - gray) * factor);
      data[i + 1] = Math.min(255, gray + (g - gray) * factor);
      data[i + 2] = Math.min(255, gray + (b - gray) * factor);
      // Make near-white very white (document background cleaning)
      if (luma > 190) {
        data[i] = data[i + 1] = data[i + 2] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function fileToDataUrl(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 5,
    maxWidthOrHeight: 2480,
    useWebWorker: true,
  });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(compressed);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function usePdfScanner() {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileName, setFileName] = useState("scanned-document");
  const [paperSize, setPaperSize] = useState<PaperSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [margin, setMargin] = useState(20);
  const processingRef = useRef(false);

  const processPage = useCallback(
    async (page: ScannedPage): Promise<ScannedPage> => {
      const img = await loadImage(page.originalDataUrl);
      const processedDataUrl = applyFilterToCanvas(
        img,
        page.filter,
        page.brightness,
        page.contrast,
        page.rotation
      );
      return { ...page, processedDataUrl };
    },
    []
  );

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setIsProcessing(true);

      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );

      const newPages: ScannedPage[] = await Promise.all(
        fileArray.map(async (file) => {
          const originalDataUrl = await fileToDataUrl(file);
          const id = `page-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const page: ScannedPage = {
            id,
            originalDataUrl,
            processedDataUrl: originalDataUrl,
            filter: "magic",
            rotation: 0,
            brightness: 105,
            contrast: 115,
            fileName: file.name,
          };
          return processPage(page);
        })
      );

      setPages((prev) => [...prev, ...newPages]);
      if (newPages.length > 0 && !selectedId) {
        setSelectedId(newPages[0].id);
      }

      processingRef.current = false;
      setIsProcessing(false);
    },
    [selectedId, processPage]
  );

  const updatePage = useCallback(
    async (id: string, updates: Partial<ScannedPage>) => {
      setPages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      // Re-process the page with new settings
      setPages((prev) => {
        const page = prev.find((p) => p.id === id);
        if (!page) return prev;
        const updated = { ...page, ...updates };
        loadImage(updated.originalDataUrl).then((img) => {
          const processedDataUrl = applyFilterToCanvas(
            img,
            updated.filter,
            updated.brightness,
            updated.contrast,
            updated.rotation
          );
          setPages((current) =>
            current.map((p) =>
              p.id === id ? { ...p, ...updates, processedDataUrl } : p
            )
          );
        });
        return prev;
      });
    },
    []
  );

  const deletePage = useCallback(
    (id: string) => {
      setPages((prev) => {
        const newPages = prev.filter((p) => p.id !== id);
        if (selectedId === id) {
          setSelectedId(newPages.length > 0 ? newPages[0].id : null);
        }
        return newPages;
      });
    },
    [selectedId]
  );

  const reorderPages = useCallback((newOrder: ScannedPage[]) => {
    setPages(newOrder);
  }, []);

  const rotatePage = useCallback(
    async (id: string, direction: "cw" | "ccw") => {
      setPages((prev) => {
        const page = prev.find((p) => p.id === id);
        if (!page) return prev;
        const delta = direction === "cw" ? 90 : -90;
        const newRotation = ((page.rotation + delta) % 360 + 360) % 360;
        const updated = { ...page, rotation: newRotation };
        loadImage(updated.originalDataUrl).then((img) => {
          const processedDataUrl = applyFilterToCanvas(
            img,
            updated.filter,
            updated.brightness,
            updated.contrast,
            updated.rotation
          );
          setPages((current) =>
            current.map((p) =>
              p.id === id
                ? { ...p, rotation: newRotation, processedDataUrl }
                : p
            )
          );
        });
        return prev.map((p) =>
          p.id === id ? { ...p, rotation: newRotation } : p
        );
      });
    },
    []
  );

  const generatePdf = useCallback(async () => {
    if (pages.length === 0) return;
    setIsGenerating(true);

    try {
      const [pw, ph] = PAPER_DIMS[paperSize];
      const docW = orientation === "portrait" ? pw : ph;
      const docH = orientation === "portrait" ? ph : pw;

      const pdf = new jsPDF({
        orientation,
        unit: "pt",
        format: paperSize,
      });

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (i > 0) pdf.addPage(paperSize, orientation);

        const contentW = docW - margin * 2;
        const contentH = docH - margin * 2;

        const img = await loadImage(page.processedDataUrl);
        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;
        const imgRatio = imgW / imgH;
        const boxRatio = contentW / contentH;

        let drawW: number, drawH: number, offsetX: number, offsetY: number;

        if (imgRatio > boxRatio) {
          drawW = contentW;
          drawH = contentW / imgRatio;
          offsetX = margin;
          offsetY = margin + (contentH - drawH) / 2;
        } else {
          drawH = contentH;
          drawW = contentH * imgRatio;
          offsetX = margin + (contentW - drawW) / 2;
          offsetY = margin;
        }

        pdf.addImage(
          page.processedDataUrl,
          "JPEG",
          offsetX,
          offsetY,
          drawW,
          drawH
        );
      }

      pdf.save(`${fileName || "scanned-document"}.pdf`);
    } finally {
      setIsGenerating(false);
    }
  }, [pages, fileName, paperSize, orientation, margin]);

  const selectedPage = pages.find((p) => p.id === selectedId) ?? null;

  return {
    pages,
    selectedId,
    selectedPage,
    isProcessing,
    isGenerating,
    fileName,
    paperSize,
    orientation,
    margin,
    setSelectedId,
    setFileName,
    setPaperSize,
    setOrientation,
    setMargin,
    addFiles,
    updatePage,
    deletePage,
    reorderPages,
    rotatePage,
    generatePdf,
  };
}
