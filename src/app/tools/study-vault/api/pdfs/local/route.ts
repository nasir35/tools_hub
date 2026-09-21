import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudyPdf from "@/app/tools/study-vault/models/StudyPdf";
import { toPlainPdf, getStudyVaultUserId } from "@/app/tools/study-vault/utils/apiHelper";
import cloudinary from "@/lib/cloudinary";
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

    // Mode 1: File browsed and uploaded — store in Cloudinary
    if (fileBuffer) {
      const displayName =
        (originalName && originalName.trim()) || fileName || "document.pdf";

      // Upload to Cloudinary via stream
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `study-pdfs/${userId}`,
            resource_type: "raw",
            public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(fileBuffer);
      });

      const sid = crypto.randomUUID();

      await dbConnect();
      const pdf = await StudyPdf.create({
        sid,
        userId,
        projectId: projectId || null,
        storageType: "cloudinary",
        filename: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
        originalName: displayName,
        uploadedAt: new Date(),
        studyData: { annotations: [], snips: [], updatedAt: null, lastOpenedAt: null },
      });

      return NextResponse.json(toPlainPdf(pdf), { status: 201 });
    }

    // Mode 2: Link direct disk path (reference only — for local dev)
    if (!localPath || !localPath.trim()) {
      return NextResponse.json({ error: "localPath or file is required" }, { status: 400 });
    }

    const cleanPath = localPath.trim().replace(/^["']|["']$/g, "");
    const displayName = (originalName && originalName.trim()) || cleanPath.split(/[/\\]/).pop() || "document.pdf";
    const sid = crypto.randomUUID();

    await dbConnect();
    const pdf = await StudyPdf.create({
      sid,
      userId,
      projectId: projectId || null,
      storageType: "local",
      localPath: cleanPath,
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
