import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudySession from "@/app/tools/study-vault/models/StudySession";
import { toPlainSession, getStudyVaultUserId } from "@/app/tools/study-vault/utils/apiHelper";
import crypto from "crypto";

export async function GET() {
  const userId = await getStudyVaultUserId();

  try {
    await dbConnect();
    const sessions = await StudySession.find({ userId }).sort({ startedAt: -1 });
    return NextResponse.json(sessions.map(toPlainSession), { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await getStudyVaultUserId();

  try {
    const { title, projectId } = await req.json();
    const ssid = crypto.randomUUID();
    await dbConnect();
    const newSession = await StudySession.create({
      ssid,
      userId,
      projectId: projectId || null,
      title: title || "Study Session",
      startedAt: new Date(),
      snips: [],
    });

    return NextResponse.json(toPlainSession(newSession), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

