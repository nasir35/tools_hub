import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudySession from "@/app/tools/study-vault/models/StudySession";
import { toPlainSession, getStudyVaultUserId } from "@/app/tools/study-vault/utils/apiHelper";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getStudyVaultUserId();
  const { id } = await params;

  try {
    await dbConnect();
    const s = await StudySession.findOne({ ssid: id, userId });
    if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    return NextResponse.json(toPlainSession(s), { status: 200 });
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
    const s = await StudySession.findOne({ ssid: id, userId });
    if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    if (body.title) s.title = body.title;
    if (body.endedAt !== undefined) s.endedAt = body.endedAt;
    if (body.snips) s.snips = body.snips;

    await s.save();
    return NextResponse.json(toPlainSession(s), { status: 200 });
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
    const s = await StudySession.findOneAndDelete({ ssid: id, userId });
    if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

