import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Project from "@/app/tools/study-vault/models/Project";
import Note from "@/app/tools/study-vault/models/Note";
import { toPlainProject } from "@/app/tools/study-vault/utils/apiHelper";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { name, color } = await req.json();
    await dbConnect();

    const updateFields: any = {};
    if (name) updateFields.name = name.trim();
    if (color) updateFields.color = color;

    const project = await Project.findOneAndUpdate(
      { pid: id, userId: session.user.id },
      { $set: updateFields },
      { new: true }
    );

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json(toPlainProject(project), { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await dbConnect();
    const project = await Project.findOneAndDelete({ pid: id, userId: session.user.id });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Remove or reset notes in this project
    await Note.deleteMany({ projectId: id, userId: session.user.id });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
