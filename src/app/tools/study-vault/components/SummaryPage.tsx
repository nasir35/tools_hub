"use client";

import React, { useMemo, useState } from "react";
import {
  Clock,
  BookOpen,
  Bookmark,
  FileText,
  Calendar,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { NoteEntry, ProjectEntry, PdfEntry, SessionEntry, StudyTimeEntry } from "../utils/types";

interface SummaryPageProps {
  notes: NoteEntry[];
  projects: ProjectEntry[];
  pdfs: PdfEntry[];
  sessions: SessionEntry[];
  studyTimes: StudyTimeEntry[];
  onBack?: () => void;
  isDarkMode?: boolean;
}

const fmtDuration = (secs: number) => {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m < 60) return `${m}m ${s > 0 ? `${s}s` : ""}`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h}h ${remM > 0 ? `${remM}m` : ""}`;
};

export const SummaryPage: React.FC<SummaryPageProps> = ({
  notes,
  projects,
  pdfs,
  sessions,
  studyTimes,
  onBack,
  isDarkMode = false,
}) => {
  const d = isDarkMode;
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month" | "all">("today");

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredStudyTimes = useMemo(() => {
    if (timeFilter === "today") {
      return studyTimes.filter((t) => t.date === todayStr);
    }
    if (timeFilter === "week") {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      return studyTimes.filter((t) => new Date(t.date) >= date);
    }
    if (timeFilter === "month") {
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      return studyTimes.filter((t) => new Date(t.date) >= date);
    }
    return studyTimes;
  }, [studyTimes, timeFilter, todayStr]);

  const totalFilteredSeconds = useMemo(() => {
    return filteredStudyTimes.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [filteredStudyTimes]);

  const totalSnips = useMemo(() => {
    return pdfs.reduce((acc, p) => acc + (p.studyData?.snips?.length || 0), 0);
  }, [pdfs]);

  const notesByProject = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notes) {
      const pId = n.projectId || "unassigned";
      counts[pId] = (counts[pId] || 0) + 1;
    }
    return counts;
  }, [notes]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className={`flex items-center justify-between border-b pb-4 ${d ? "border-slate-800" : "border-slate-200"}`}>
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={`p-2 rounded-xl transition ${
                d ? "text-slate-400 hover:text-white hover:bg-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className={`text-xl font-bold ${d ? "text-white" : "text-slate-900"}`}>
              Study Vault Analytics
            </h2>
            <p className={`text-xs ${d ? "text-slate-400" : "text-slate-500"}`}>
              Overview of notes, documents, captured snips, and active study duration
            </p>
          </div>
        </div>

        {/* Time period filter */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border ${d ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          {(["today", "week", "month", "all"] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setTimeFilter(period)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                timeFilter === period
                  ? "bg-blue-600 text-white shadow-sm"
                  : d ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {period === "all" ? "All Time" : period}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${d ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Study Time ({timeFilter})</span>
            <Clock size={16} className="text-blue-500" />
          </div>
          <p className={`text-2xl font-bold font-mono ${d ? "text-white" : "text-slate-900"}`}>
            {fmtDuration(totalFilteredSeconds)}
          </p>
        </div>

        <div className={`p-5 rounded-2xl border ${d ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Notes</span>
            <FileText size={16} className="text-emerald-500" />
          </div>
          <p className={`text-2xl font-bold ${d ? "text-white" : "text-slate-900"}`}>{notes.length}</p>
        </div>

        <div className={`p-5 rounded-2xl border ${d ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Study PDFs</span>
            <BookOpen size={16} className="text-purple-500" />
          </div>
          <p className={`text-2xl font-bold ${d ? "text-white" : "text-slate-900"}`}>{pdfs.length}</p>
        </div>

        <div className={`p-5 rounded-2xl border ${d ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Snips Captured</span>
            <Bookmark size={16} className="text-amber-500" />
          </div>
          <p className={`text-2xl font-bold ${d ? "text-white" : "text-slate-900"}`}>{totalSnips}</p>
        </div>
      </div>

      {/* Detailed breakdown: Projects & Study Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects / Subjects Distribution */}
        <div className={`p-5 rounded-3xl border space-y-4 ${d ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${d ? "text-white" : "text-slate-900"}`}>
            <Layers size={16} className="text-blue-500" />
            <span>Notes by Subject</span>
          </h3>

          <div className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No projects created yet</p>
            ) : (
              projects.map((proj) => {
                const count = notesByProject[proj.id] || 0;
                const pct = notes.length > 0 ? Math.round((count / notes.length) * 100) : 0;

                return (
                  <div key={proj.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className={`flex items-center gap-2 ${d ? "text-slate-200" : "text-slate-800"}`}>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: proj.color }}
                        />
                        <span>{proj.name}</span>
                      </span>
                      <span className={d ? "text-slate-400" : "text-slate-500"}>
                        {count} notes ({pct}%)
                      </span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${d ? "bg-slate-800" : "bg-slate-100"}`}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: proj.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Study Time Logs */}
        <div className={`p-5 rounded-3xl border space-y-4 ${d ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${d ? "text-white" : "text-slate-900"}`}>
            <Calendar size={16} className="text-emerald-500" />
            <span>Recent Study Activity</span>
          </h3>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {filteredStudyTimes.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No recorded study activity for this time filter
              </p>
            ) : (
              filteredStudyTimes.slice(0, 10).map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                    d ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className={`font-semibold truncate ${d ? "text-slate-200" : "text-slate-800"}`}>
                      {t.pdfName || "Document"}
                    </p>
                    <p className={`text-[10px] font-mono mt-0.5 ${d ? "text-slate-500" : "text-slate-400"}`}>
                      {t.date}
                    </p>
                  </div>
                  <span className="font-mono text-emerald-500 font-semibold shrink-0">
                    +{fmtDuration(t.duration)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
