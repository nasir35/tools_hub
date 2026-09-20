"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowDownAZ, ArrowUpAZ, ArrowDownWideNarrow, ArrowUpNarrowWide, Check } from "lucide-react";

interface SortButtonProps {
  sortOrder: "newest" | "oldest" | "name" | "snips";
  setSortOrder: (order: "newest" | "oldest" | "name" | "snips") => void;
  isDarkMode: boolean;
}

export const SortButton: React.FC<SortButtonProps> = ({
  sortOrder,
  setSortOrder,
  isDarkMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: { id: "newest" | "oldest" | "name" | "snips"; label: string; icon: React.ReactNode }[] = [
    { id: "newest", label: "Newest", icon: <ArrowDownWideNarrow size={16} /> },
    { id: "oldest", label: "Oldest", icon: <ArrowUpNarrowWide size={16} /> },
    { id: "name", label: "A-Z Order", icon: <ArrowDownAZ size={16} /> },
  ];

  const currentOption = options.find((opt) => opt.id === sortOrder) || options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition border text-sm ${
          isDarkMode
            ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        } active:scale-95`}
        title={`Sort: ${currentOption.label}`}
      >
        <span className="text-blue-500">{currentOption.icon}</span>
        <span className="hidden sm:inline text-xs font-medium">{currentOption.label}</span>
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-1.5 w-44 rounded-xl shadow-xl border z-50 py-1 ${
            isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-100 text-slate-800"
          }`}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setSortOrder(option.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors ${
                sortOrder === option.id
                  ? "text-blue-500 bg-blue-500/10 font-semibold"
                  : isDarkMode
                  ? "hover:bg-slate-700 text-slate-300"
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {option.icon}
                {option.label}
              </div>
              {sortOrder === option.id && <Check size={14} strokeWidth={3} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
