import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudyTime from "@/app/tools/study-vault/models/StudyTime";
import { getStudyVaultUserId } from "@/app/tools/study-vault/utils/apiHelper";
import crypto from "crypto";

export async function GET() {
  const userId = await getStudyVaultUserId();

  try {
    await dbConnect();
    const times = await StudyTime.find({ userId }).sort({ date: -1 });
    return NextResponse.json(
      times.map((t) => ({
        id: t.stid,
        userId: t.userId,
        pdfId: t.pdfId,
        pdfName: t.pdfName,
        sessionId: t.sessionId,
        duration: t.duration,
        date: t.date,
      })),
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await getStudyVaultUserId();

  try {
    const { pdfId, pdfName, sessionId, duration, date } = await req.json();
    if (!duration || !date) {
      return NextResponse.json({ error: "Duration and date are required" }, { status: 400 });
    }

    await dbConnect();
    const stid = crypto.randomUUID();
    const record = await StudyTime.create({
      stid,
      userId,
      pdfId: pdfId || null,
      pdfName: pdfName || "",
      sessionId: sessionId || null,
      duration: Math.round(duration),
      date,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

