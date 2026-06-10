import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Tool from "@/models/Tool";
import Link from "next/link";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

export default async function Home() {
  const session = await getServerSession(authOptions);

  await dbConnect();
  // Fetch tools from DB
  const tools = await Tool.find({}).lean();

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Tools Hub</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Access all your custom utilities in one place. Fast, responsive, and always ready.
        </p>
      </div>

      {!tools || tools.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No tools added yet. Head to the Admin panel to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool: any) => (
            <div key={tool._id.toString()} className="group transition-transform hover:-translate-y-1">
              <Link href={tool.href}>
                <div className="h-full flex flex-col p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tool.color || 'bg-blue-500'} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <DynamicIcon name={tool.iconName} className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm flex-1">
                    {tool.description}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

