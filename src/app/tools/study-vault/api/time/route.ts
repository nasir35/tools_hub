import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import StudyTime from "@/app/tools/study-vault/models/StudyTime";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const times = await StudyTime.find({ userId: session.user.id }).sort({ date: -1 });
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pdfId, pdfName, sessionId, duration, date } = await req.json();
    if (!duration || !date) {
      return NextResponse.json({ error: "Duration and date are required" }, { status: 400 });
    }

    await dbConnect();
    const stid = crypto.randomUUID();
    const record = await StudyTime.create({
      stid,
      userId: session.user.id,
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
