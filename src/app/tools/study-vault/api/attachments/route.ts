import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { file, filename, type, folder } = await req.json();
    if (!file) {
      return NextResponse.json({ error: "No file data provided" }, { status: 400 });
    }

    const buffer = Buffer.from(file, "base64");
    const uploadFolder = `tools-hub/study-vault/attachments/${session.user.id}${
      folder ? "/" + folder.replace(/[^a-zA-Z0-9_-]/g, "_") : ""
    }`;

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: uploadFolder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json(
      {
        success: true,
        filename: filename || "attachment",
        type: type || "image/png",
        folder: folder || null,
        path: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        size: buffer.length,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { publicId } = await req.json();
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
  }
}
