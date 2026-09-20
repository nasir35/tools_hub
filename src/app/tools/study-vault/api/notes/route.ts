import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Note from "@/app/tools/study-vault/models/Note";
import { toPlainNote } from "@/app/tools/study-vault/utils/apiHelper";
import crypto from "crypto";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  try {
    await dbConnect();
    const query: any = { userId: session.user.id };
    if (projectId && projectId !== "all") {
      query.projectId = projectId;
    }

    const notes = await Note.find(query).sort({ pinned: -1, updatedAt: -1 });
    return NextResponse.json(notes.map(toPlainNote), { status: 200 });
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
    const body = await req.json();
    const nid = crypto.randomUUID();

    await dbConnect();
    const note = await Note.create({
      nid,
      userId: session.user.id,
      projectId: body.projectId || null,
      title: body.title || "",
      content: body.content || "",
      attachments: body.attachments || [],
      attachmentFolder: body.attachmentFolder || null,
      thumbnail: body.thumbnail || null,
      pinned: !!body.pinned,
    });

    return NextResponse.json(toPlainNote(note), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
