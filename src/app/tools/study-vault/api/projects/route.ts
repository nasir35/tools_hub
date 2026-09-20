import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Project from "@/app/tools/study-vault/models/Project";
import { toPlainProject } from "@/app/tools/study-vault/utils/apiHelper";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const projects = await Project.find({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json(projects.map(toPlainProject), { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, color } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const pid = crypto.randomUUID();
    await dbConnect();
    const project = await Project.create({
      pid,
      userId: session.user.id,
      name: name.trim(),
      color: color || "#6366f1",
    });

    return NextResponse.json(toPlainProject(project), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
