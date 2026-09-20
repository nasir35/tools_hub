"use client";

import React, { useState } from "react";
import { getAttachmentUrl } from "../utils/attachmentPaths";
import { AttachmentItem } from "../utils/types";

interface AttachmentPreviewProps {
  attachment: AttachmentItem;
  onRemove?: () => void;
  isDarkMode: boolean;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachment,
  onRemove,
  isDarkMode,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const isImage = attachment.type?.startsWith("image/");
  const url = getAttachmentUrl(attachment);

  return (
    <>
      <div
        className={`relative group border rounded-xl p-2.5 cursor-pointer transition ${
          isDarkMode
            ? "border-slate-800 bg-slate-900/60 hover:border-blue-500"
            : "border-slate-200 bg-white hover:border-blue-500 shadow-sm"
        }`}
      >
        <div
          onClick={() => setShowPreview(true)}
          className="w-full h-20 flex items-center justify-center overflow-hidden rounded-lg"
        >
          {isImage ? (
            <img
              src={url}
              alt={attachment.name || "preview"}
              className="max-h-20 max-w-full object-contain rounded"
            />
          ) : (
            <div className="text-center">
              <div className="text-2xl mb-1">📄</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                {attachment.name?.split(".")[0] || "document"}
              </div>
            </div>
          )}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-5 h-5 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs shadow-md"
            title="Remove attachment"
          >
            ✕
          </button>
        )}
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div
            className={`rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col ${
              isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex justify-between items-center p-4 border-b shrink-0 ${
                isDarkMode ? "border-slate-800 text-white" : "border-slate-200 text-slate-800"
              }`}
            >
              <h3 className="font-semibold text-sm truncate">{attachment.name}</h3>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-lg p-1 text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto flex-1">
              {isImage ? (
                <img
                  src={url}
                  alt={attachment.name || "preview"}
                  className="max-h-[70vh] object-contain rounded-lg"
                />
              ) : (
                <iframe
                  src={url}
                  className="w-full h-[65vh] rounded-lg border-0"
                  title="PDF Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
