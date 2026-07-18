"use client";

import { motion } from "framer-motion";
import { Edit, MapPin, CalendarDays, ExternalLink, School, CheckCircle2, CircleDashed, Clock, XCircle, FileText } from "lucide-react";

export interface University {
  _id: string;
  name: string;
  program: string;
  location?: string;
  status: "Researching" | "Shortlisted" | "Applied" | "Accepted" | "Rejected";
  deadline?: string;
  requirements: string[];
  notes?: string;
  images: string[];
}

interface UniversityCardProps {
  university: University;
  onEdit: (university: University) => void;
}

const statusConfig = {
  Researching: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CircleDashed },
  Shortlisted: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: School },
  Applied: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  Accepted: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  Rejected: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export default function UniversityCard({ university, onEdit }: UniversityCardProps) {
  const StatusIcon = statusConfig[university.status].icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">{university.name}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{university.program}</p>
        </div>
        <button
          onClick={() => onEdit(university)}
          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>

      {/* Tags / Badges */}
      <div className="flex flex-wrap gap-2 mb-6 relative z-10">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[university.status].color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {university.status}
        </span>
        {university.location && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5" />
            <span className="max-w-[100px] truncate">{university.location}</span>
          </span>
        )}
      </div>

      {/* Body / Info */}
      <div className="space-y-3 mb-6 flex-1 relative z-10">
        {university.deadline && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span>Deadline: <strong className="font-medium text-slate-800 dark:text-slate-200">{new Date(university.deadline).toLocaleDateString()}</strong></span>
          </div>
        )}
        
        {university.requirements && university.requirements.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
            <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="flex flex-wrap gap-1">
              {university.requirements.slice(0, 3).map((req, idx) => (
                <span key={idx} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                  {req}
                </span>
              ))}
              {university.requirements.length > 3 && (
                <span className="text-xs text-slate-400 px-1 py-0.5">+{university.requirements.length - 3} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Images preview */}
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
        {university.images && university.images.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden">
              {university.images.slice(0, 3).map((img, i) => (
                <img key={i} src={img} alt="Preview" className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" />
              ))}
            </div>
            {university.images.length > 3 && (
              <span className="text-xs font-medium text-slate-500">+{university.images.length - 3} images</span>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">No images saved</div>
        )}
      </div>
    </motion.div>
  );
}
