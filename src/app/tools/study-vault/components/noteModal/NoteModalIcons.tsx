"use client";

import React, { useState } from "react";

export const ICONS: Record<string, string> = {
  bold: "M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z",
  italic: "M19 4h-9M14 20H5M15 4L9 20",
  underline: "M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M4 21h16",
  strikethrough: "M17.3 12.3A6 6 0 0 1 6 12 M4 12h16 M7.7 5.3a6 6 0 0 1 10.6 4.2",
  h1: "M4 12h8M4 18V6M12 18V6M17 12l3-3v9",
  h2: "M4 12h8M4 18V6M12 18V6M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1",
  ul: "M9 6h11M9 12h11M9 18h11M5 6v.01M5 12v.01M5 18v.01",
  ol: "M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-2",
  quote:
    "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  math: "M4 6h16M4 12h8M4 18h16M14 15l4 4M18 15l-4 4",
  attach:
    "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
  info: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16v-4 M12 8h.01",
  undo: "M9 14L4 9l5-5M4 9h10a4 4 0 0 1 0 8h-3",
  redo: "M15 14l5-5-5-5M20 9h-10a4 4 0 0 0 0 8h3",
};

export const Icon: React.FC<{ d: string; size?: number; color?: string; title?: string }> = ({
  d,
  size = 16,
  color = "currentColor",
  title,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-label={title}
  >
    {title && <title>{title}</title>}
    <path d={d} />
  </svg>
);

export const IBtn: React.FC<{
  iconKey: string;
  title: string;
  active?: boolean;
  onClick: () => void;
  color?: string;
  size?: number;
}> = ({ iconKey, title, active, onClick, color, size = 15 }) => {
  const [hov, setHov] = useState(false);
  const bg = active ? "#3b82f6" : hov ? "rgba(99,102,241,0.12)" : "transparent";
  const col = active ? "#fff" : color || "currentColor";

  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        background: bg,
        color: col,
        transition: "background 0.12s,transform 0.1s",
        transform: hov ? "scale(1.08)" : "scale(1)",
        flexShrink: 0,
      }}
    >
      <Icon d={ICONS[iconKey]} size={size} color={col} title={title} />
    </button>
  );
};

export const Sep: React.FC<{ d: boolean }> = ({ d }) => (
  <div
    style={{
      width: 1,
      height: 22,
      background: d ? "rgba(148,163,184,0.2)" : "rgba(0,0,0,0.1)",
      margin: "0 3px",
      flexShrink: 0,
    }}
  />
);
