import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Project from "@/app/tools/study-vault/models/Project";
import { toPlainProject, getStudyVaultUserId } from "@/app/tools/study-vault/utils/apiHelper";
import crypto from "crypto";

export async function GET() {
  const userId = await getStudyVaultUserId();

  try {
    await dbConnect();
    const projects = await Project.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(projects.map(toPlainProject), { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await getStudyVaultUserId();

  try {
    const { name, color } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const pid = crypto.randomUUID();
    await dbConnect();
    const project = await Project.create({
      pid,
      userId,
      name: name.trim(),
      color: color || "#6366f1",
    });

    return NextResponse.json(toPlainProject(project), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

