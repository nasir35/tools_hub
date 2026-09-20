import { jsPDF } from "jspdf";
import { getAttachmentUrl } from "./attachmentPaths";

const drawImageToDoc = (
  doc: jsPDF,
  url: string,
  yPosition: number,
  margin: number,
  maxWidth: number,
  pageHeight: number
): Promise<number> => {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "Anonymous";

    image.onload = () => {
      const imgWidth = maxWidth - 10;
      const imgHeight = (imgWidth / image.width) * image.height;
      let currentY = yPosition;

      if (currentY + imgHeight > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }

      try {
        doc.addImage(image, "PNG", margin + 5, currentY, imgWidth, imgHeight);
        resolve(currentY + imgHeight + 10);
      } catch {
        resolve(currentY);
      }
    };

    image.onerror = () => {
      resolve(yPosition);
    };

    image.src = url;
  });
};

export const exportToPDF = async (notes: any[]) => {
  try {
    const doc = new jsPDF();
    let yPosition = 20;
    const margin = 15;
    const pageHeight = doc.internal.pageSize.height;
    const maxWidth = doc.internal.pageSize.width - 2 * margin;

    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text("Study Notes Export", margin, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Exported: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Total Notes: ${notes.length}`, margin, yPosition);
    yPosition += 15;

    for (const [index, note] of notes.entries()) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(33, 150, 243);
      doc.text(`${index + 1}. ${note.title || "Untitled Note"}`, margin, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setTextColor(150);
      const dateText = note.updatedAt ? new Date(note.updatedAt).toLocaleString() : "N/A";
      doc.text(`Last updated: ${dateText}`, margin + 5, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setTextColor(60);
      const cleanContent = (note.content || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const splitContent = doc.splitTextToSize(cleanContent, maxWidth - 10);

      for (const line of splitContent) {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin + 5, yPosition);
        yPosition += 6;
      }

      yPosition += 4;

      if (note.attachments && note.attachments.length > 0) {
        for (const att of note.attachments) {
          if (att.type?.startsWith("image/")) {
            const url = getAttachmentUrl(att);
            yPosition = await drawImageToDoc(doc, url, yPosition, margin, maxWidth, pageHeight);
          }
        }
      }

      yPosition += 10;
    }

    doc.save(`Study_Notes_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (error) {
    console.error("Failed to export PDF:", error);
  }
};
