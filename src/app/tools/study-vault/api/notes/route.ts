import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Note from "@/app/tools/study-vault/models/Note";
import { toPlainNote, getStudyVaultUserId } from "@/app/tools/study-vault/utils/apiHelper";
import crypto from "crypto";

export async function GET(req: Request) {
  const userId = await getStudyVaultUserId();

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  try {
    await dbConnect();
    const query: any = { userId };
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
  const userId = await getStudyVaultUserId();

  try {
    const body = await req.json();
    const nid = crypto.randomUUID();

    await dbConnect();
    const note = await Note.create({
      nid,
      userId,
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
