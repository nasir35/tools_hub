import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import User from "@/models/User";
import Tool from "@/models/Tool";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  // If we rely purely on middleware, this is just an extra safety check
  if (session?.user?.role !== "admin") {
    redirect("/");
  }

  await dbConnect();
  
  // Fetch users and tools
  const users = await User.find({}).lean();
  const tools = await Tool.find({}).lean();

  // Convert ObjectIds to strings to pass to Client Component safely
  const serializedUsers = users.map(u => ({ ...u, _id: u._id.toString() }));
  const serializedTools = tools.map(t => ({ ...t, _id: t._id.toString() }));

  return (
    <AdminDashboard initialUsers={serializedUsers} initialTools={serializedTools} />
  );
}

