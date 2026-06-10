"use client";

import { useState } from "react";
import { User, Shield, Trash2, Plus, Wrench, Search, Loader2, Edit, ExternalLink, Calculator, BookOpen, Clock, Code, Calendar, Pen, Image, FileText, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AVAILABLE_ICONS = ["Calculator", "BookOpen", "Clock", "Code", "Wrench", "Calendar", "Pen", "Image", "FileText", "CheckCircle2"];
const AVAILABLE_COLORS = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-indigo-500", "bg-cyan-500", "bg-fuchsia-500"];

export function AdminDashboard({ initialUsers, initialTools }: { initialUsers: any[], initialTools: any[] }) {
  const [activeTab, setActiveTab] = useState<"users" | "tools">("users");
  const [search, setSearch] = useState("");
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [isManualIcon, setIsManualIcon] = useState(false);
  const router = useRouter();

  // Tool Form State
  const [toolForm, setToolForm] = useState({
    name: "", description: "", iconName: "Wrench", href: "", color: "bg-blue-500"
  });

  const filteredUsers = initialUsers.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!confirm("Are you sure you want to delete this tool?")) return;
    try {
      await fetch(`/api/admin/tools?toolId=${toolId}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (tool: any) => {
    setToolForm({
      name: tool.name,
      description: tool.description,
      iconName: tool.iconName,
      href: tool.href,
      color: tool.color
    });
    setEditingToolId(tool._id);
    setIsToolModalOpen(true);
  };

  const handleCreateOrUpdateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isEditing = !!editingToolId;
      const method = isEditing ? "PUT" : "POST";
      const payload = isEditing ? { _id: editingToolId, ...toolForm } : toolForm;

      await fetch("/api/admin/tools", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setIsToolModalOpen(false);
      setToolForm({ name: "", description: "", iconName: "Wrench", href: "", color: "bg-blue-500" });
      setEditingToolId(null);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Admin Dashboard
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "users" 
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" 
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <User className="w-4 h-4 mr-2" />
          Users
        </button>
        <button
          onClick={() => setActiveTab("tools")}
          className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "tools" 
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" 
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Wrench className="w-4 h-4 mr-2" />
          Tools Hub
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "users" && (
          <motion.div
            key="users-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* User Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Users</p>
                <p className="text-3xl font-bold">{initialUsers.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Admins</p>
                <p className="text-3xl font-bold">{initialUsers.filter(u => u.role === 'admin').length}</p>
              </div>
            </div>

            {/* User Search & Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <div className="relative w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredUsers.map((u: any) => (
                      <tr key={u._id.toString()}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{u.name || "N/A"}</div>
                          <div className="text-sm text-slate-500">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            u.role === "admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                          <button 
                            onClick={() => handleRoleChange(u._id, u.role === "admin" ? "user" : "admin")}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors px-2"
                            title={u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                          >
                            <Shield className="w-4 h-4 inline" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors px-2"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "tools" && (
          <motion.div
            key="tools-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-end">
              <button 
                onClick={() => {
                  setEditingToolId(null);
                  setToolForm({ name: "", description: "", iconName: "Wrench", href: "", color: "bg-blue-500" });
                  setIsToolModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Tool
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {initialTools.map((tool) => (
                <div key={tool._id} className="relative group bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                  <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(tool)}
                      className="text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-800 rounded p-1 shadow-sm border border-slate-200 dark:border-slate-700"
                      title="Edit Tool"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTool(tool._id)}
                      className="text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded p-1 shadow-sm border border-slate-200 dark:border-slate-700"
                      title="Delete Tool"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link href={tool.href} className="text-slate-400 hover:text-green-500 bg-white dark:bg-slate-800 rounded p-1 shadow-sm border border-slate-200 dark:border-slate-700" title="Visit Tool">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tool.color} text-white mb-4`}>
                    <DynamicIcon name={tool.iconName} className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{tool.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 flex-1">{tool.description}</p>
                  <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
                    {tool.href}
                  </div>
                </div>
              ))}
              {initialTools.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No tools configured yet. Add your first tool!
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Tool Modal */}
      <AnimatePresence>
        {isToolModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <h2 className="text-2xl font-bold mb-4">{editingToolId ? "Edit Tool" : "Add New Tool"}</h2>
              <form onSubmit={handleCreateOrUpdateTool} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input required value={toolForm.name} onChange={e => setToolForm({...toolForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-300 dark:border-slate-700" placeholder="e.g. CG Calculator" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input required value={toolForm.description} onChange={e => setToolForm({...toolForm, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-300 dark:border-slate-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Route Path / HTML File</label>
                  <input required value={toolForm.href} onChange={e => setToolForm({...toolForm, href: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-300 dark:border-slate-700" placeholder="e.g. /tools/cg-calculator or /cg.html" />
                </div>
                
                {/* Icon Selector */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Select Icon</label>
                    {!isManualIcon && (
                      <button 
                        type="button" 
                        onClick={() => setIsManualIcon(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Manual Input
                      </button>
                    )}
                  </div>
                  
                  {isManualIcon ? (
                    <div className="flex space-x-2">
                      <input 
                        required 
                        value={toolForm.iconName} 
                        onChange={e => setToolForm({...toolForm, iconName: e.target.value})} 
                        className="flex-1 px-3 py-2 border rounded-lg bg-transparent border-slate-300 dark:border-slate-700" 
                        placeholder="e.g. BrainCircuit" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setIsManualIcon(false)}
                        className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-2">
                      {AVAILABLE_ICONS.map(icon => (
                        <button
                          type="button"
                          key={icon}
                          onClick={() => setToolForm({...toolForm, iconName: icon})}
                          className={`p-2 rounded-lg flex justify-center items-center border ${toolForm.iconName === icon ? 'bg-slate-100 dark:bg-slate-800 border-blue-500 text-blue-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}
                        >
                          <DynamicIcon name={icon} className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-sm font-medium mb-2">Select Color</label>
                  <div className="flex space-x-2">
                    {AVAILABLE_COLORS.map(color => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setToolForm({...toolForm, color})}
                        className={`w-8 h-8 rounded-full ${color} ring-offset-2 dark:ring-offset-slate-900 transition-all ${toolForm.color === color ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-110'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setIsToolModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (editingToolId ? "Update Tool" : "Save Tool")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
