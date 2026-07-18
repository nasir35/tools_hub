"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { University } from "../components/UniversityCard";
import { ArrowLeft, MapPin, CalendarDays, CheckCircle2, CircleDashed, Clock, School, XCircle, FileText, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

const statusConfig = {
  Researching: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CircleDashed },
  Shortlisted: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: School },
  Applied: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  Accepted: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  Rejected: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export default function UniversityDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [university, setUniversity] = useState<University | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUniversity = async () => {
      try {
        const res = await fetch(`/api/tools/universities/${id}`);
        if (res.ok) {
          const data = await res.json();
          setUniversity(data);
        }
      } catch (error) {
        console.error("Failed to fetch university details:", error);
      }
      setIsLoading(false);
    };
    if (id) fetchUniversity();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!university) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">University Not Found</h2>
        <button onClick={() => router.push("/tools/university-tracker")} className="mt-4 text-blue-500 hover:underline">
          Back to Tracker
        </button>
      </div>
    );
  }

  const StatusIcon = statusConfig[university.status].icon;
  const coverImage = university.images && university.images.length > 0 ? university.images[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto pb-20 space-y-8"
    >
      <button
        onClick={() => router.push("/tools/university-tracker")}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Tracker
      </button>

      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="h-64 sm:h-80 w-full relative bg-slate-100 dark:bg-slate-800">
          {coverImage ? (
            <img src={coverImage} alt={university.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <School className="w-20 h-20 text-slate-300 dark:text-slate-700" />
            </div>
          )}
          <div className="absolute top-4 left-4">
             <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-md backdrop-blur-md bg-white/90 dark:bg-slate-900/90 ${statusConfig[university.status].color.split(" ")[1]} dark:${statusConfig[university.status].color.split(" ")[3]}`}>
               <StatusIcon className="w-4 h-4" />
               {university.status}
             </span>
          </div>
        </div>

        <div className="p-8 sm:p-12 relative">
          <div className="absolute -top-12 right-8 w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-800">
            <School className="w-12 h-12 text-blue-500" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">{university.name}</h1>
          <p className="text-xl text-blue-600 dark:text-blue-400 font-medium mb-6">{university.program}</p>

          <div className="flex flex-wrap gap-6 text-slate-600 dark:text-slate-400">
            {university.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-400" />
                <span className="font-medium">{university.location}</span>
              </div>
            )}
            {university.deadline && (
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-slate-400" />
                <span>Deadline: <strong className="text-slate-900 dark:text-white font-semibold">{new Date(university.deadline).toLocaleDateString()}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          {/* Notes Section */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-500" />
              Notes & Research
            </h2>
            {university.notes ? (
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{university.notes}</p>
            ) : (
              <p className="text-slate-400 italic">No notes added for this university.</p>
            )}
          </div>

          {/* Image Gallery */}
          {university.images && university.images.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-purple-500" />
                Gallery
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {university.images.map((img, idx) => (
                  <a key={idx} href={img} target="_blank" rel="noreferrer" className="group block rounded-2xl overflow-hidden aspect-video bg-slate-100 dark:bg-slate-800 relative">
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <span className="text-white font-medium text-sm px-4 py-2 bg-black/50 rounded-full backdrop-blur-md">View Full</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              Requirements
            </h2>
            {university.requirements && university.requirements.length > 0 ? (
              <ul className="space-y-4">
                {university.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="mt-0.5 shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{req}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 italic">No specific requirements added.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
