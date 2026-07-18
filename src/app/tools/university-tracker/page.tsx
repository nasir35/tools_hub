"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, GraduationCap, School } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UniversityCard, { University } from "./components/UniversityCard";
import UniversityFormModal from "./components/UniversityFormModal";
import toast, { Toaster } from "react-hot-toast";

export default function UniversityTrackerPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUniversities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tools/universities");
      if (res.ok) {
        const data = await res.json();
        setUniversities(data);
      }
    } catch (error) {
      console.error("Failed to fetch universities:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  const handleSave = async (data: Partial<University>) => {
    setIsSaving(true);
    try {
      if (editingUniversity) {
        const res = await fetch(`/api/tools/universities/${editingUniversity._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const updated = await res.json();
          setUniversities(universities.map(u => (u._id === updated._id ? updated : u)));
          toast.success("University updated successfully!");
          setIsModalOpen(false);
          setEditingUniversity(null);
        } else {
          const err = await res.json();
          toast.error(err.message || "Failed to update university");
        }
      } else {
        const res = await fetch("/api/tools/universities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const created = await res.json();
          setUniversities([created, ...universities]);
          toast.success("University added successfully!");
          setIsModalOpen(false);
          setEditingUniversity(null);
        } else {
          const err = await res.json();
          toast.error(err.message || "Failed to add university");
        }
      }
    } catch (error) {
      console.error("Failed to save university:", error);
      toast.error("An unexpected error occurred.");
    }
    setIsSaving(false);
  };

  const openNewModal = () => {
    setEditingUniversity(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">University Tracker</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl">
            Keep track of your master's program applications, requirements, and deadlines in one place.
          </p>
        </div>
        
        <button
          onClick={openNewModal}
          className="relative z-10 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add University
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse">Loading your universities...</p>
          </div>
        ) : universities.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <School className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No universities yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
              Start building your application list by adding the master's programs you're interested in.
            </p>
            <button
              onClick={openNewModal}
              className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-2xl hover:scale-105 transition-transform"
            >
              Add Your First Program
            </button>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {universities.map((uni) => (
                <UniversityCard
                  key={uni._id}
                  university={uni}
                  onEdit={(u) => {
                    setEditingUniversity(u);
                    setIsModalOpen(true);
                  }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <UniversityFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUniversity(null);
        }}
        onSave={handleSave}
        university={editingUniversity}
        isLoading={isSaving}
      />
      <Toaster position="bottom-right" />
    </div>
  );
}
