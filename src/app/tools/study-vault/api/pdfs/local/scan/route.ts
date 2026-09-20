import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudyPdf from "@/app/tools/study-vault/models/StudyPdf";
import { getStudyVaultUserId } from "@/app/tools/study-vault/utils/apiHelper";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const userId = await getStudyVaultUserId();

  try {
    const { directoryPath } = await req.json();
    let targetDir = directoryPath;
    if (!targetDir || !targetDir.trim()) {
      targetDir = process.env.LOCAL_PDF_DIR || process.cwd();
    }

    const cleanDir = targetDir.trim().replace(/^["']|["']$/g, "");
    const resolvedDir = path.resolve(cleanDir);

    if (!fs.existsSync(resolvedDir)) {
      return NextResponse.json({ error: `Directory not found: ${resolvedDir}` }, { status: 404 });
    }

    const dirStat = fs.statSync(resolvedDir);
    if (!dirStat.isDirectory()) {
      return NextResponse.json({ error: "The provided path is a file, not a directory." }, { status: 400 });
    }

    const entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
    const pdfFiles: any[] = [];

    await dbConnect();
    const existingPdfs = await StudyPdf.find({ userId }).select("localPath");
    const existingPaths = new Set(
      existingPdfs.map((p) => (p.localPath ? path.resolve(p.localPath).toLowerCase() : ""))
    );

    for (const entry of entries) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
        const fullPath = path.join(resolvedDir, entry.name);
        try {
          const stat = fs.statSync(fullPath);
          pdfFiles.push({
            name: entry.name,
            path: fullPath,
            sizeBytes: stat.size,
            sizeFormatted: (stat.size / (1024 * 1024)).toFixed(2) + " MB",
            modifiedAt: stat.mtime,
            isImported: existingPaths.has(fullPath.toLowerCase()),
          });
        } catch {}
      }
    }

    return NextResponse.json({
      scannedDirectory: resolvedDir,
      totalFound: pdfFiles.length,
      files: pdfFiles,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Directory scan failed: " + error.message }, { status: 500 });
  }
}
