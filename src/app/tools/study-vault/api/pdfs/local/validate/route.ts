import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {

  try {
    const { localPath } = await req.json();
    if (!localPath || !localPath.trim()) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    const cleanPath = localPath.trim().replace(/^["']|["']$/g, "");
    const resolvedPath = path.resolve(cleanPath);

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({
        valid: false,
        exists: false,
        message: "File not found at this path",
      });
    }

    const stat = fs.statSync(resolvedPath);
    const isFile = stat.isFile();
    const isPdf = isFile && resolvedPath.toLowerCase().endsWith(".pdf");

    return NextResponse.json({
      valid: isPdf,
      exists: true,
      isFile,
      isDirectory: stat.isDirectory(),
      isPdf,
      sizeBytes: stat.size,
      sizeFormatted: (stat.size / (1024 * 1024)).toFixed(2) + " MB",
      filename: path.basename(resolvedPath),
      resolvedPath,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
