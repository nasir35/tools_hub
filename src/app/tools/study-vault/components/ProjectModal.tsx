"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import toast from "react-hot-toast";
import { ProjectEntry } from "../utils/types";

const PROJECT_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
];

interface ProjectModalProps {
  onClose: () => void;
  onProjectSaved: () => void;
  existingProject?: ProjectEntry | null;
  isDarkMode?: boolean;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  onClose,
  onProjectSaved,
  existingProject,
  isDarkMode = false,
}) => {
  const d = isDarkMode;
  const [name, setName] = useState(existingProject?.name || "");
  const [color, setColor] = useState(existingProject?.color || PROJECT_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!existingProject;

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const url = isEditing
        ? `/tools/study-vault/api/projects/${existingProject.id}`
        : `/tools/study-vault/api/projects`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save project");

      toast.success(isEditing ? "Project updated!" : "Project created!");
      onProjectSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div
        className={`rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border ${
          d ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div
          className={`flex items-center justify-between p-5 border-b ${
            d ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <h2 className="text-base font-bold flex items-center gap-2">
            <span>{isEditing ? "Edit Subject / Project" : "New Subject / Project"}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-lg transition ${
              d ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${d ? "text-slate-300" : "text-slate-700"}`}>
              Subject Name:
            </label>
            <input
              type="text"
              placeholder="e.g. Calculus, Physics, Machine Learning"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              autoFocus
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                d
                  ? "border-slate-700 bg-slate-800 text-white placeholder-slate-500"
                  : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-2 ${d ? "text-slate-300" : "text-slate-700"}`}>
              Color Tag:
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition flex items-center justify-center ${
                    color === c ? "ring-2 ring-blue-500 scale-110 shadow-lg" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={14} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          <div className={`pt-3 border-t flex gap-2 ${d ? "border-slate-800" : "border-slate-200"}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                d ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition shadow-sm"
            >
              {isLoading ? "Saving…" : isEditing ? "Save Changes" : "Create Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
