export const getAttachmentPath = (attachment: any): string => {
  if (!attachment) return "";
  if (typeof attachment === "string") return attachment;
  return attachment.path || attachment.url || attachment.filename || attachment.name || "";
};

export const getAttachmentUrl = (attachment: any): string => {
  const relPath = getAttachmentPath(attachment);
  if (!relPath) return "";
  if (relPath.startsWith("http://") || relPath.startsWith("https://") || relPath.startsWith("data:")) {
    return relPath;
  }
  return String(relPath).replace(/\\/g, "/").replace(/^\/+/, "");
};
