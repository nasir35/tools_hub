import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import StudyPdf from "@/app/tools/study-vault/models/StudyPdf";
import StudySession from "@/app/tools/study-vault/models/StudySession";
import { toPlainPdf } from "@/app/tools/study-vault/utils/apiHelper";
import path from "path";

export async function GET(
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
    const pdf = await StudyPdf.findOne({ sid: id, userId: session.user.id });
    if (!pdf) return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    return NextResponse.json(toPlainPdf(pdf), { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const body = await req.json();
    await dbConnect();
    const pdf = await StudyPdf.findOne({ sid: id, userId: session.user.id });
    if (!pdf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.originalName) pdf.originalName = body.originalName;
    if (body.projectId !== undefined) pdf.projectId = body.projectId;
    if (body.localPath !== undefined) {
      const raw = body.localPath;
      if (raw && raw.trim()) {
        pdf.localPath = path.resolve(raw.trim().replace(/^["']|["']$/g, ""));
        pdf.storageType = "local";
      } else {
        pdf.localPath = null;
      }
    }
    if (body.storageType !== undefined) pdf.storageType = body.storageType;
    if (body.studyData) {
      pdf.studyData = { ...pdf.studyData.toObject(), ...body.studyData };
      pdf.markModified("studyData");
    }

    await pdf.save();
    return NextResponse.json(toPlainPdf(pdf), { status: 200 });
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
    const pdf = await StudyPdf.findOneAndDelete({ sid: id, userId: session.user.id });
    if (!pdf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await StudySession.updateMany(
      { userId: session.user.id },
      { $pull: { snips: { sourcePdfId: id } } }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
