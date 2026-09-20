import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import StudyPdf from "@/app/tools/study-vault/models/StudyPdf";
import fs from "fs";
import { Readable } from "stream";

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
    if (!pdf) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    // ── Local File Streaming ──
    const isLocal = pdf.storageType === "local" || (pdf.localPath && !pdf.filename?.startsWith("http"));
    if (isLocal) {
      const filePath = pdf.localPath;
      if (!filePath || !fs.existsSync(filePath)) {
        return NextResponse.json(
          {
            error: "LOCAL_FILE_NOT_FOUND",
            message: "Local PDF file was not found at the saved path. It may have been moved, renamed, or the drive was unmounted.",
            savedPath: filePath || "Unknown path",
            documentId: pdf.sid,
            originalName: pdf.originalName,
          },
          { status: 404 }
        );
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.get("range");

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const nodeStream = fs.createReadStream(filePath, { start, end });
        const webStream = Readable.toWeb(nodeStream);

        return new Response(webStream as any, {
          status: 206,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize.toString(),
          },
        });
      } else {
        const nodeStream = fs.createReadStream(filePath);
        const webStream = Readable.toWeb(nodeStream);

        return new Response(webStream as any, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Length": fileSize.toString(),
            "Accept-Ranges": "bytes",
          },
        });
      }
    }

    // ── Cloudinary / Remote Stream ──
    const fileUrl = pdf.filename;
    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL found" }, { status: 404 });
    }

    const cloudRes = await fetch(fileUrl);
    if (!cloudRes.ok) {
      return NextResponse.json({ error: "Failed to fetch from cloud storage" }, { status: cloudRes.status });
    }

    return new Response(cloudRes.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        ...(cloudRes.headers.get("content-length")
          ? { "Content-Length": cloudRes.headers.get("content-length")! }
          : {}),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
