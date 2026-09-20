import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudyPdf from "@/app/tools/study-vault/models/StudyPdf";
import StudySession from "@/app/tools/study-vault/models/StudySession";
import { toPlainPdf, getStudyVaultUserId } from "@/app/tools/study-vault/utils/apiHelper";
import path from "path";
import fs from "fs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getStudyVaultUserId();
  const { id } = await params;

  try {
    await dbConnect();
    const pdf = await StudyPdf.findOne({ sid: id, userId });
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
  const userId = await getStudyVaultUserId();
  const { id } = await params;

  try {
    const contentType = req.headers.get("content-type") || "";
    let fileBuffer: Buffer | null = null;
    let fileName = "";
    let originalName: string | undefined;
    let projectId: string | null | undefined;
    let localPath: string | null | undefined;
    let storageType: string | undefined;
    let studyData: any = undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (file && typeof file !== "string") {
        const arrayBuf = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuf);
        fileName = file.name;
      }
      originalName = (formData.get("originalName") as string) || undefined;
      projectId = formData.has("projectId")
        ? (formData.get("projectId") as string) || null
        : undefined;
      localPath = (formData.get("localPath") as string) || undefined;
      storageType = (formData.get("storageType") as string) || undefined;
    } else {
      const body = await req.json();
      if (body.file) {
        fileBuffer = Buffer.from(body.file, "base64");
        fileName = body.filename || "document.pdf";
      }
      originalName = body.originalName;
      projectId = body.projectId;
      localPath = body.localPath;
      storageType = body.storageType;
      studyData = body.studyData;
    }

    await dbConnect();
    const pdf = await StudyPdf.findOne({ sid: id, userId });
    if (!pdf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Handle replacement file upload
    if (fileBuffer) {
      const localDir = path.join(
        process.cwd(),
        "uploads",
        "study-vault",
        "local-pdfs",
        userId
      );
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      const safeName = (fileName || "document.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = path.join(localDir, safeName);
      fs.writeFileSync(filePath, fileBuffer);

      pdf.localPath = filePath;
      pdf.storageType = "local";
      pdf.filename = safeName;
      if (originalName) pdf.originalName = originalName;
    }

    if (originalName && !fileBuffer) pdf.originalName = originalName;
    if (projectId !== undefined) pdf.projectId = projectId;
    if (localPath !== undefined && !fileBuffer) {
      const raw = localPath;
      if (raw && raw.trim()) {
        pdf.localPath = path.resolve(raw.trim().replace(/^["']|["']$/g, ""));
        pdf.storageType = "local";
      } else {
        pdf.localPath = null;
      }
    }
    if (storageType !== undefined) pdf.storageType = storageType;
    if (studyData) {
      pdf.studyData = { ...pdf.studyData.toObject(), ...studyData };
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
  const userId = await getStudyVaultUserId();
  const { id } = await params;

  try {
    await dbConnect();
    const pdf = await StudyPdf.findOneAndDelete({ sid: id, userId });
    if (!pdf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await StudySession.updateMany(
      { userId },
      { $pull: { snips: { sourcePdfId: id } } }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
