import { getAttachmentPath } from "../../utils/attachmentPaths";
import { AttachmentItem } from "../../utils/types";

export const buildAttachmentFolder = (title: string): string => {
  const firstWord = String(title || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0];
  const safeWord =
    (firstWord || "note")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "note";

  const iso = new Date().toISOString();
  const [datePart, timePartRaw] = iso.split("T");
  const [hh, mm, ssMsZ] = timePartRaw.split(":");
  const [ss, msZ] = ssMsZ.split(".");
  const formattedDate = datePart.replace(/-/g, "_");
  const formattedTime = `${hh}-${mm}-${ss}${msZ || "000Z"}`;

  return `${safeWord}_${formattedDate}T${formattedTime}`;
};

export const getAttachmentTargetFolder = (noteFolder: string, file: { type: string }): string => {
  const bucket = file.type === "application/pdf" ? "pdfs" : "images";
  return `${noteFolder}/${bucket}`;
};

export const collectAttachmentsFromContent = (
  html: string,
  noteAttachments: AttachmentItem[],
  attachmentFolder: string
): AttachmentItem[] => {
  if (typeof window === "undefined") return noteAttachments;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || "", "text/html");
  const referencedPaths = new Set<string>();

  doc.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src") || "";
    referencedPaths.add(src);
    const marker = "/attachments/";
    const index = src.indexOf(marker);
    if (index >= 0) referencedPaths.add(src.slice(index + marker.length));
  });

  doc.querySelectorAll("[data-pdf]").forEach((node) => {
    const pdfPath = node.getAttribute("data-pdf");
    if (pdfPath) referencedPaths.add(pdfPath);
  });

  const preservedLegacy = noteAttachments.filter((att) => {
    const attPath = getAttachmentPath(att);
    return (
      attPath &&
      !referencedPaths.has(attPath) &&
      (!attachmentFolder || !attPath.startsWith(`${attachmentFolder}/`))
    );
  });

  const referencedAttachments = noteAttachments.filter((att) => {
    const p = getAttachmentPath(att);
    return referencedPaths.has(p) || (att.url && referencedPaths.has(att.url));
  });

  return [...preservedLegacy, ...referencedAttachments];
};
