import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import StudyPdf from "@/app/tools/study-vault/models/StudyPdf";
import { toPlainPdf } from "@/app/tools/study-vault/utils/apiHelper";
import cloudinary from "@/lib/cloudinary";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const pdfs = await StudyPdf.find({ userId: session.user.id }).sort({ uploadedAt: -1 });
    return NextResponse.json(pdfs.map(toPlainPdf), { status: 200 });
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
    const { file, originalName, projectId } = await req.json();
    if (!file || !originalName) {
      return NextResponse.json({ error: "File and originalName are required" }, { status: 400 });
    }

    await dbConnect();

    // Upload to Cloudinary using base64 data URI
    const dataUri = `data:application/pdf;base64,${file}`;
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "study-pdfs",
      resource_type: "raw",
    });

    const sid = crypto.randomUUID();
    const pdf = await StudyPdf.create({
      sid,
      userId: session.user.id,
      projectId: projectId || null,
      storageType: "cloudinary",
      filename: uploadResult.secure_url,
      originalName,
      uploadedAt: new Date(),
      studyData: { annotations: [], snips: [], updatedAt: null, lastOpenedAt: null },
    });

    return NextResponse.json(toPlainPdf(pdf), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
  }
}
