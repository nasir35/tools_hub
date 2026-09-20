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
    const { localPath, originalName, projectId } = await req.json();
    if (!localPath || !localPath.trim()) {
      return NextResponse.json({ error: "localPath is required" }, { status: 400 });
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
      return NextResponse.json({ error: "The provided path is a directory, not a file." }, { status: 400 });
    }

    if (!resolvedPath.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Selected file must be a .pdf document." }, { status: 400 });
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
    return NextResponse.json({ error: "Failed to link local PDF: " + error.message }, { status: 500 });
  }
}
