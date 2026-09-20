import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudyPdf from "@/app/tools/study-vault/models/StudyPdf";
import { toPlainPdf, getStudyVaultUserId } from "@/app/tools/study-vault/utils/apiHelper";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  const userId = await getStudyVaultUserId();

  try {
    const contentType = req.headers.get("content-type") || "";

    let fileBuffer: Buffer | null = null;
    let fileName: string = "";
    let originalName: string = "";
    let projectId: string | null = null;
    let localPath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (file && typeof file !== "string") {
        const arrayBuf = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuf);
        fileName = file.name;
      }
      originalName = (formData.get("originalName") as string) || fileName;
      projectId = (formData.get("projectId") as string) || null;
    } else {
      const body = await req.json();
      if (body.file) {
        fileBuffer = Buffer.from(body.file, "base64");
        fileName = body.filename || "document.pdf";
      }
      originalName = body.originalName || fileName;
      projectId = body.projectId || null;
      localPath = body.localPath || null;
    }

    // Mode 1: File browsed and uploaded directly to local disk
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

      const displayName =
        (originalName && originalName.trim()) || fileName || safeName;
      const sid = crypto.randomUUID();

      await dbConnect();
      const pdf = await StudyPdf.create({
        sid,
        userId,
        projectId: projectId || null,
        storageType: "local",
        localPath: filePath,
        filename: displayName,
        originalName: displayName,
        uploadedAt: new Date(),
        studyData: { annotations: [], snips: [], updatedAt: null, lastOpenedAt: null },
      });

      return NextResponse.json(toPlainPdf(pdf), { status: 201 });
    }

    // Mode 2: Link direct disk path
    if (!localPath || !localPath.trim()) {
      return NextResponse.json({ error: "localPath or file is required" }, { status: 400 });
    }

    const cleanPath = localPath.trim().replace(/^["']|["']$/g, "");
    const resolvedPath = path.resolve(cleanPath);

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json(
        { error: "FILE_NOT_FOUND", message: `File does not exist on disk at: ${resolvedPath}` },
        { status: 404 }
      );
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isFile()) {
      return NextResponse.json(
        { error: "The provided path is a directory, not a file." },
        { status: 400 }
      );
    }

    if (!resolvedPath.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Selected file must be a .pdf document." },
        { status: 400 }
      );
    }

    const displayName = (originalName && originalName.trim()) || path.basename(resolvedPath);
    const sid = crypto.randomUUID();

    await dbConnect();
    const pdf = await StudyPdf.create({
      sid,
      userId,
      projectId: projectId || null,
      storageType: "local",
      localPath: resolvedPath,
      filename: displayName,
      originalName: displayName,
      uploadedAt: new Date(),
      studyData: { annotations: [], snips: [], updatedAt: null, lastOpenedAt: null },
    });

    return NextResponse.json(toPlainPdf(pdf), { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to link local PDF: " + error.message },
      { status: 500 }
    );
  }
}
