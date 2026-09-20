import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import StudyPdf from "@/app/tools/study-vault/models/StudyPdf";
import { toPlainPdf } from "@/app/tools/study-vault/utils/apiHelper";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Mode 1: File browsed and uploaded directly to local disk
    if (body.file) {
      const buffer = Buffer.from(body.file, "base64");
      const localDir = path.join(
        process.cwd(),
        "uploads",
        "study-vault",
        "local-pdfs",
        session.user.id
      );

      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      const safeName = (body.filename || "document.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = path.join(localDir, safeName);
      fs.writeFileSync(filePath, buffer);

      const displayName =
        (body.originalName && body.originalName.trim()) || body.filename || safeName;
      const sid = crypto.randomUUID();

      await dbConnect();
      const pdf = await StudyPdf.create({
        sid,
        userId: session.user.id,
        projectId: body.projectId || null,
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
    const { localPath, originalName, projectId } = body;
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
      userId: session.user.id,
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
