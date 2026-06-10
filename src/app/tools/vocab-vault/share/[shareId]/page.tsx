import dbConnect from "@/lib/mongodb";
import SharedVocabLink from "@/models/SharedVocabLink";
import Vocabulary from "@/models/Vocabulary";
import { BookOpen, CalendarCheck, Link as LinkIcon, PenLine } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const CATEGORY_COLORS: Record<string, string> = {
  "General": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  "Homophone": "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  "Synonym": "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  "Idiom": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  "Academic": "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  "Tricky Pronunciation": "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
};

export default async function SharedVocabPage({ params }: { params: Promise<{ shareId: string }> }) {
  await dbConnect();
  
  const resolvedParams = await params;

  const shareLink = await SharedVocabLink.findOne({ shareId: resolvedParams.shareId });
  if (!shareLink) {
    notFound();
  }

  if (shareLink.isActive === false) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4 text-center">
        <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Link Paused</h2>
        <p className="text-slate-500 mt-2">The author has temporarily paused access to this vocabulary list.</p>
      </div>
    );
  }

  // Fetch words for this user
  let query: any = { userId: shareLink.userId };
  const allUserWords = await Vocabulary.find(query).sort({ createdAt: -1 }).lean();

  // Filter by selected dates if applicable
  let filteredWords = allUserWords;
  if (shareLink.sharedDates && shareLink.sharedDates.length > 0) {
    filteredWords = allUserWords.filter(item => {
      const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      return shareLink.sharedDates.includes(dateStr);
    });
  }

  // Group by date
  const groupedWords: Record<string, any[]> = {};
  filteredWords.forEach(item => {
    const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    if (!groupedWords[dateStr]) groupedWords[dateStr] = [];
    groupedWords[dateStr].push(item);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center py-8">
        <BookOpen className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Vocabulary Notes
        </h1>
        <p className="text-slate-500 mt-2">
          Shared by <span className="font-semibold text-slate-700 dark:text-slate-300">{shareLink.authorName}</span>
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        {filteredWords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No vocabulary words found for the shared dates.</p>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((item: any) => (
                    <div 
                      key={item._id.toString()} 
                      className="bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                          <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 capitalize">{item.word}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS['General']}`}>
                            {item.category}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-3">{item.meaning}</p>

                      {item.synonyms && (
                        <div className="mb-2 text-xs flex items-start">
                          <LinkIcon className="w-3 h-3 mr-1.5 text-slate-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-slate-400"><strong className="text-slate-700 dark:text-slate-300">Synonyms:</strong> {item.synonyms}</span>
                        </div>
                      )}

                      {item.example && (
                        <div className="mb-2 text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 italic">
                          "{item.example}"
                        </div>
                      )}

                      {item.notes && (
                        <div className="text-xs mt-3 flex items-start">
                          <PenLine className="w-3 h-3 mr-1.5 text-slate-500 mt-0.5 flex-shrink-0" />
                          <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 px-2 py-1 rounded-md inline-block">
                            <strong className="opacity-70">Notes:</strong> {item.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center pt-8">
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium text-sm">
          Powered by Tools Hub
        </Link>
      </div>
    </div>
  );
}
