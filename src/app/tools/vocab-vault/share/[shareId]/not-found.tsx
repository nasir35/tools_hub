import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";

export default function SharedVocabNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <SearchX className="w-10 h-10 text-indigo-500" />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Link Not Found</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Oops! It looks like this vocabulary list doesn't exist anymore, or the link is broken. The author might have permanently deleted it.
          </p>

          <Link 
            href="/" 
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-sm shadow-indigo-500/20 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Tools Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
