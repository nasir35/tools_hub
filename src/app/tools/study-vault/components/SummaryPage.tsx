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
}) => {
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month" | "all">("today");

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredStudyTimes = useMemo(() => {
    if (timeFilter === "today") {
      return studyTimes.filter((t) => t.date === todayStr);
    }
    if (timeFilter === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return studyTimes.filter((t) => new Date(t.date) >= d);
    }
    if (timeFilter === "month") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return studyTimes.filter((t) => new Date(t.date) >= d);
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
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">Study Vault Analytics</h2>
            <p className="text-xs text-slate-400">
              Overview of notes, documents, captured snips, and active study duration
            </p>
          </div>
        </div>

        {/* Time period filter */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
          {(["today", "week", "month", "all"] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setTimeFilter(period)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                timeFilter === period
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {period === "all" ? "All Time" : period}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Study Time ({timeFilter})</span>
            <Clock size={16} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {fmtDuration(totalFilteredSeconds)}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Notes</span>
            <FileText size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{notes.length}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Study PDFs</span>
            <BookOpen size={16} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{pdfs.length}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Snips Captured</span>
            <Bookmark size={16} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalSnips}</p>
        </div>
      </div>

      {/* Detailed breakdown: Projects & Study Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects / Subjects Distribution */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers size={16} className="text-blue-400" />
            <span>Notes by Subject</span>
          </h3>

          <div className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No projects created yet</p>
            ) : (
              projects.map((proj) => {
                const count = notesByProject[proj.id] || 0;
                const pct = notes.length > 0 ? Math.round((count / notes.length) * 100) : 0;

                return (
                  <div key={proj.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-2 text-slate-200">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: proj.color }}
                        />
                        <span>{proj.name}</span>
                      </span>
                      <span className="text-slate-400">
                        {count} notes ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
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
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar size={16} className="text-emerald-400" />
            <span>Recent Study Activity</span>
          </h3>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {filteredStudyTimes.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No recorded study activity for this time filter
              </p>
            ) : (
              filteredStudyTimes.slice(0, 10).map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-200 truncate">
                      {t.pdfName || "Document"}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t.date}</p>
                  </div>
                  <span className="font-mono text-emerald-400 font-semibold shrink-0">
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
