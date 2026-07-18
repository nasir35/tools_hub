import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import University from "@/models/University";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const universities = await University.find({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json(universities, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching universities" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    await dbConnect();

    // Handle image uploads
    if (data.images && data.images.length > 0) {
      const uploadPromises = data.images.map(async (img: string) => {
        // If it's a base64 string, upload to Cloudinary
        if (img.startsWith("data:image")) {
          const uploadRes = await cloudinary.uploader.upload(img, {
            folder: "tools-hub/universities",
          });
          return uploadRes.secure_url;
        }
        return img;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      data.images = uploadedImages;
    }

    const newUniversity = await University.create({
      ...data,
      userId: session.user.id,
    });
    return NextResponse.json(newUniversity, { status: 201 });
  } catch (error) {
    console.error("Cloudinary/DB Error:", error);
    return NextResponse.json({ message: "Error saving university" }, { status: 500 });
  }
}
