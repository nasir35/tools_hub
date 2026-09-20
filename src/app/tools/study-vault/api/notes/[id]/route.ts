import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Note from "@/app/tools/study-vault/models/Note";
import { toPlainNote, getStudyVaultUserId } from "@/app/tools/study-vault/utils/apiHelper";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getStudyVaultUserId();
  const { id } = await params;

  try {
    await dbConnect();
    const note = await Note.findOne({ nid: id, userId });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    return NextResponse.json(toPlainNote(note), { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getStudyVaultUserId();
  const { id } = await params;

  try {
    const body = await req.json();
    await dbConnect();

    const updateFields: any = {};
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.content !== undefined) updateFields.content = body.content;
    if (body.projectId !== undefined) updateFields.projectId = body.projectId;
    if (body.attachments !== undefined) updateFields.attachments = body.attachments;
    if (body.attachmentFolder !== undefined) updateFields.attachmentFolder = body.attachmentFolder;
    if (body.thumbnail !== undefined) updateFields.thumbnail = body.thumbnail;
    if (body.pinned !== undefined) updateFields.pinned = body.pinned;

    const note = await Note.findOneAndUpdate(
      { nid: id, userId },
      { $set: updateFields },
      { new: true }
    );

    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    return NextResponse.json(toPlainNote(note), { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getStudyVaultUserId();
  const { id } = await params;

  try {
    await dbConnect();
    const note = await Note.findOneAndDelete({ nid: id, userId });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

