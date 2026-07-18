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

import { useRouter } from "next/navigation";

export default function UniversityCard({ university, onEdit }: UniversityCardProps) {
  const router = useRouter();
  const StatusIcon = statusConfig[university.status].icon;
  const coverImage = university.images && university.images.length > 0 ? university.images[0] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => router.push(`/tools/university-tracker/${university._id}`)}
      className="group cursor-pointer relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden"
    >
      {/* Cover Photo */}
      <div className="w-full h-48 relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt={university.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <School className="w-12 h-12 text-slate-300 dark:text-slate-700" />
          </div>
        )}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
           <button
             onClick={(e) => {
               e.stopPropagation();
               onEdit(university);
             }}
             className="p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 rounded-full shadow-sm transition-colors"
           >
             <Edit className="w-4 h-4" />
           </button>
        </div>
        <div className="absolute top-3 left-3 z-10">
           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${statusConfig[university.status].color} bg-opacity-90 backdrop-blur-sm`}>
             <StatusIcon className="w-3.5 h-3.5" />
             {university.status}
           </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{university.name}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{university.program}</p>
        </div>

        {/* Body / Info */}
        <div className="space-y-3 mb-4 flex-1">
          {university.location && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{university.location}</span>
            </div>
          )}
          
          {university.deadline && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Deadline: <strong className="font-medium text-slate-800 dark:text-slate-200">{new Date(university.deadline).toLocaleDateString()}</strong></span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
           <div className="text-xs text-slate-500">
              {university.requirements.length} Requirements
           </div>
           {university.images.length > 1 && (
             <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
               +{university.images.length - 1} photos
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
}
