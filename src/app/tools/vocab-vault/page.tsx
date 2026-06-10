"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { BookOpen, Search, Trash2, Plus, CalendarCheck, Link as LinkIcon, PenLine, Loader2, X, Share2, Copy, Check, ChevronDown, ChevronUp, Pause, Play, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  "General": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  "Homophone": "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  "Synonym": "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  "Idiom": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  "Academic": "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  "Tricky Pronunciation": "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
};

function WordCard({ item, editingWordId, handleEditClick, handleDelete }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isEditing = editingWordId === item._id;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-900 rounded-xl border hover:shadow-md transition-all relative group ${isEditing ? 'border-amber-400 dark:border-amber-500/50 ring-2 ring-amber-400/20' : 'border-slate-200 dark:border-slate-800'}`}
    >
      <div 
        className="p-4 sm:p-5 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-400 capitalize">{item.word}</h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS['General']}`}>
            {item.category}
          </span>
        </div>
        
        <div className="flex space-x-2 items-center">
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); handleEditClick(item); }} 
              className="text-slate-400 hover:text-amber-500 p-1 bg-slate-50 dark:bg-slate-800 rounded"
              title="Edit"
            >
              <PenLine className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} 
              className="text-slate-400 hover:text-red-500 p-1 bg-slate-50 dark:bg-slate-800 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <button className="text-slate-400 p-1" title={isExpanded ? "Collapse" : "Expand"}>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800/50 mt-2">
              <p className="text-slate-800 dark:text-slate-200 font-medium mb-3">{item.meaning}</p>

              {item.synonyms && (
                <div className="mb-2 text-sm flex items-start">
                  <LinkIcon className="w-4 h-4 mr-1.5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400"><strong className="text-slate-700 dark:text-slate-300">Synonyms:</strong> {item.synonyms}</span>
                </div>
              )}

              {item.example && (
                <div className="mb-2 text-sm bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 italic">
                  "{item.example}"
                </div>
              )}

              {item.notes && (
                <div className="text-sm mt-3 flex items-start">
                  <PenLine className="w-4 h-4 mr-1.5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 px-2 py-1 rounded-md inline-block">
                    <strong className="opacity-70">Notes:</strong> {item.notes}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function VocabVault() {
  const { data: session, status } = useSession();
  
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [form, setForm] = useState({
    word: "", meaning: "", category: "General", synonyms: "", example: "", notes: ""
  });

  // Sharing State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedShareDates, setSelectedShareDates] = useState<string[]>([]);
  const [generatedShareLink, setGeneratedShareLink] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // Manage Links State
  const [isManageLinksModalOpen, setIsManageLinksModalOpen] = useState(false);
  const [activeLinks, setActiveLinks] = useState<any[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  const fetchActiveLinks = async () => {
    setIsLoadingLinks(true);
    try {
      const res = await fetch("/api/tools/vocab/share/manage");
      if (res.ok) {
        setActiveLinks(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const handleTogglePause = async (shareId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/tools/vocab/share/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId, isActive: !currentStatus })
      });
      if (res.ok) {
        setActiveLinks(activeLinks.map(link => link.shareId === shareId ? { ...link, isActive: !currentStatus } : link));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLink = async (shareId: string) => {
    if (!confirm("Are you sure you want to permanently delete this public link?")) return;
    try {
      const res = await fetch(`/api/tools/vocab/share/manage?shareId=${shareId}`, { method: "DELETE" });
      if (res.ok) {
        setActiveLinks(activeLinks.filter(link => link.shareId !== shareId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchVocabulary();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchVocabulary = async () => {
    try {
      const res = await fetch("/api/tools/vocab");
      if (res.ok) {
        const data = await res.json();
        setVocabulary(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item: any) => {
    setEditingWordId(item._id);
    setForm({
      word: item.word,
      meaning: item.meaning,
      category: item.category,
      synonyms: item.synonyms || "",
      example: item.example || "",
      notes: item.notes || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingWordId(null);
    setForm({ word: "", meaning: "", category: "General", synonyms: "", example: "", notes: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isEditing = !!editingWordId;
      const method = isEditing ? "PUT" : "POST";
      const payload = isEditing ? { _id: editingWordId, ...form } : form;

      const res = await fetch("/api/tools/vocab", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const updatedWord = await res.json();
        if (isEditing) {
          setVocabulary(vocabulary.map(v => v._id === updatedWord._id ? updatedWord : v));
        } else {
          setVocabulary([updatedWord, ...vocabulary]);
        }
        cancelEdit();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this word?")) return;
    try {
      const res = await fetch(`/api/tools/vocab?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setVocabulary(vocabulary.filter(v => v._id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredList = useMemo(() => {
    return vocabulary.filter(item => {
      const matchesSearch = item.word.toLowerCase().includes(search.toLowerCase()) || 
                            item.meaning.toLowerCase().includes(search.toLowerCase()) ||
                            (item.synonyms && item.synonyms.toLowerCase().includes(search.toLowerCase()));
      const matchesFilter = filter === "All" || item.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [vocabulary, search, filter]);

  const groupedWords = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredList.forEach(item => {
      const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(item);
    });
    return groups;
  }, [filteredList]);

  const allAvailableDates = useMemo(() => {
    const dates = new Set<string>();
    vocabulary.forEach(item => {
      dates.add(new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }));
    });
    return Array.from(dates);
  }, [vocabulary]);

  // Sharing functionality
  const handleGenerateShareLink = async () => {
    setIsGeneratingShare(true);
    try {
      const payload = {
        sharedDates: selectedShareDates.length === allAvailableDates.length ? [] : selectedShareDates
      };
      
      const res = await fetch("/api/tools/vocab/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const { shareId } = await res.json();
        const link = `${window.location.origin}/tools/vocab-vault/share/${shareId}`;
        setGeneratedShareLink(link);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedShareLink) return;
    navigator.clipboard.writeText(generatedShareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In Required</h2>
        <p className="text-slate-500 mt-2">You need to sign in to securely save and access your vocabulary vault.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column: Form */}
      <div className="w-full lg:w-1/3">
        <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border p-6 sticky top-24 transition-colors ${editingWordId ? 'border-amber-500 dark:border-amber-500/50' : 'border-slate-200 dark:border-slate-800'}`}>
          <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              {editingWordId ? (
                <><PenLine className="w-5 h-5 mr-2 text-amber-500" /> Edit Word</>
              ) : (
                <><Plus className="w-5 h-5 mr-2 text-indigo-500" /> Add New Word</>
              )}
            </h2>
            {editingWordId && (
              <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Word / Phrase <span className="text-red-500">*</span></label>
              <input required value={form.word} onChange={e => setForm({...form, word: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="e.g., ubiquitous" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Meaning <span className="text-red-500">*</span></label>
              <textarea required value={form.meaning} onChange={e => setForm({...form, meaning: e.target.value})} rows={2} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="Present, appearing, or found everywhere." />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Category / Type</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all">
                <option value="General">General</option>
                <option value="Homophone">Homophone (Same sound, diff meaning)</option>
                <option value="Synonym">Synonym Cluster</option>
                <option value="Idiom">Idiom</option>
                <option value="Academic">Academic</option>
                <option value="Tricky Pronunciation">Tricky Pronunciation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Synonyms / Related Words</label>
              <input value={form.synonyms} onChange={e => setForm({...form, synonyms: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="e.g., omnipresent, universal" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Example Sentence</label>
              <textarea value={form.example} onChange={e => setForm({...form, example: e.target.value})} rows={2} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="His ubiquitous influence was felt by all the family." />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Notes (Pronunciation, Usage, etc.)</label>
              <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="Pronounced: yoo-bik-wi-tuhs" />
            </div>

            <button type="submit" disabled={isSubmitting} className={`w-full flex justify-center items-center py-3 px-4 rounded-xl font-medium text-white transition-colors shadow-sm disabled:opacity-70 ${editingWordId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingWordId ? "Update Word" : "Save Word")}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: List & Stats */}
      <div className="w-full lg:w-2/3 flex flex-col space-y-6">
        
        {/* Vault List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex-grow">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-indigo-500" /> My Vault
            </h2>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button 
                onClick={() => {
                  fetchActiveLinks();
                  setIsManageLinksModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" /> Manage Links
              </button>

              <button 
                onClick={() => {
                  const todayStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                  setSelectedShareDates(allAvailableDates.includes(todayStr) ? [todayStr] : []);
                  setGeneratedShareLink(null);
                  setIsShareModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" /> Share List
              </button>

              <select value={filter} onChange={e => setFilter(e.target.value)} className="w-full sm:w-auto rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all border">
                <option value="All">All Categories</option>
                <option value="General">General</option>
                <option value="Homophone">Homophones</option>
                <option value="Synonym">Synonym Clusters</option>
                <option value="Idiom">Idioms</option>
                <option value="Academic">Academic</option>
                <option value="Tricky Pronunciation">Tricky Pronunciation</option>
              </select>
            </div>
          </div>

          <div className="mb-6 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search your vocabulary..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Your vault is empty</h3>
              <p className="text-slate-500 mt-1 text-sm">Start adding vocabulary to see your progress.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedWords).map(([date, items]) => (
                <div key={date}>
                  <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg mb-4 border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
                    <span className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center text-sm">
                      <CalendarCheck className="w-4 h-4 mr-2" /> {date}
                    </span>
                    <span className="text-xs font-bold bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full">
                      {items.length} {items.length === 1 ? 'word' : 'words'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {items.map((item: any) => (
                      <WordCard 
                        key={item._id} 
                        item={item} 
                        editingWordId={editingWordId}
                        handleEditClick={handleEditClick}
                        handleDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold flex items-center"><Share2 className="w-5 h-5 mr-2 text-indigo-500" /> Share Vocabulary</h2>
                <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
              </div>

              {!generatedShareLink ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">Select the days you want to include in your public share link.</p>
                  
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                    <label className="flex items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedShareDates.length === allAvailableDates.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedShareDates(allAvailableDates);
                          else setSelectedShareDates([]);
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                      />
                      <span className="text-sm font-medium">Select All Dates</span>
                    </label>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-1 mx-2" />
                    {allAvailableDates.map(date => (
                      <label key={date} className="flex items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedShareDates.includes(date)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedShareDates([...selectedShareDates, date]);
                            else setSelectedShareDates(selectedShareDates.filter(d => d !== date));
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                        />
                        <span className="text-sm">{date}</span>
                      </label>
                    ))}
                  </div>

                  <button 
                    onClick={handleGenerateShareLink}
                    disabled={isGeneratingShare || selectedShareDates.length === 0}
                    className="w-full flex justify-center items-center py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isGeneratingShare ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate Link"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg text-sm text-center font-medium">
                    Link generated successfully!
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={generatedShareLink} 
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-600 dark:text-slate-400 focus:outline-none"
                    />
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  <div className="flex justify-between pt-2">
                    <button onClick={() => setGeneratedShareLink(null)} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                      Create another
                    </button>
                    <Link href={generatedShareLink} target="_blank" className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium">
                      Open link →
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Links Modal */}
      <AnimatePresence>
        {isManageLinksModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center"><Settings className="w-5 h-5 mr-2 text-indigo-500" /> Manage Shared Links</h2>
                <button onClick={() => setIsManageLinksModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
              </div>

              <div className="overflow-y-auto pr-2 space-y-4">
                {isLoadingLinks ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                ) : activeLinks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p>You haven't generated any share links yet.</p>
                  </div>
                ) : (
                  activeLinks.map(link => (
                    <div key={link.shareId} className={`p-4 rounded-xl border ${link.isActive ? 'border-indigo-100 dark:border-indigo-800/30 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 opacity-70'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                            {link.shareId}
                          </span>
                          {!link.isActive && <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">Paused</span>}
                        </div>
                        <p className="text-xs text-slate-500">
                          {link.sharedDates.length === 0 ? "All Dates" : link.sharedDates.join(", ")}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Link 
                          href={`/tools/vocab-vault/share/${link.shareId}`} 
                          target="_blank"
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="Open Link"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleTogglePause(link.shareId, link.isActive)}
                          className={`p-2 rounded-lg transition-colors ${link.isActive ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                          title={link.isActive ? "Pause Link" : "Resume Link"}
                        >
                          {link.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDeleteLink(link.shareId)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
