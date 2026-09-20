import { jsPDF } from "jspdf";
import { Snip } from "./types";

const getAttachmentUrl = (pathOrUrl?: string | null): string => {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http") || pathOrUrl.startsWith("data:") || pathOrUrl.startsWith("blob:")) {
    return pathOrUrl;
  }
  return pathOrUrl;
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

export const exportStudySnipsPdf = async (title: string, snips: Snip[] = []) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  let y = margin;

  const ensureSpace = (heightNeeded: number) => {
    if (y + heightNeeded <= pageHeight - margin) return;
    doc.addPage();
    y = margin;
  };

  doc.setFontSize(18);
  doc.text(title || "Study Snips", margin, y);
  y += 20;
  doc.setFontSize(10);
  doc.text(`Exported ${new Date().toLocaleString()}`, margin, y);
  y += 20;

  for (let i = 0; i < snips.length; i++) {
    const snip = snips[i];
    ensureSpace(120);

    doc.setFontSize(12);
    doc.text(`${i + 1}. ${snip.pdfName || "PDF"} - page ${snip.page || "?"}`, margin, y);
    y += 14;

    if (snip.note) {
      doc.setFontSize(10);
      const wrapped = doc.splitTextToSize(snip.note, pageWidth - margin * 2);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 12 + 8;
    }

    try {
      const url = getAttachmentUrl(snip.attachmentPath || snip.filename);
      if (url) {
        const img = await loadImage(url);
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = 220;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const drawWidth = img.width * ratio;
        const drawHeight = img.height * ratio;
        ensureSpace(drawHeight + 16);
        doc.addImage(img, "PNG", margin, y, drawWidth, drawHeight);
        y += drawHeight + 16;
      }
    } catch {
      doc.setFontSize(10);
      doc.text("[Image unavailable]", margin, y);
      y += 18;
    }

    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
  }

  doc.save(`${(title || "study-snips").replace(/[^a-z0-9_-]+/gi, "_")}.pdf`);
};
