import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import University from "@/models/University";
import cloudinary from "@/lib/cloudinary";

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ message: "Missing ID" }, { status: 400 });
    }

    await dbConnect();
    const deletedUniversity = await University.findOneAndDelete({ _id: id, userId: session.user.id });
    
    if (!deletedUniversity) {
      return NextResponse.json({ message: "University not found or unauthorized" }, { status: 404 });
    }

    // Optional: Delete images from cloudinary here if desired
    // To do that, we would extract the public_id from the URLs and call cloudinary.uploader.destroy()

    return NextResponse.json({ message: "University deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting university" }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ message: "Missing ID" }, { status: 400 });
    }

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
        // If it's already a URL (e.g., from Cloudinary), leave it as is
        return img;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      data.images = uploadedImages;
    }

    const updatedUniversity = await University.findOneAndUpdate(
      { _id: id, userId: session.user.id }, 
      data, 
      { new: true }
    );
    
    if (!updatedUniversity) {
      return NextResponse.json({ message: "University not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updatedUniversity, { status: 200 });
  } catch (error) {
    console.error("Cloudinary/DB Error:", error);
    return NextResponse.json({ message: "Error updating university" }, { status: 500 });
  }
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ message: "Missing ID" }, { status: 400 });
    }

    await dbConnect();
    const university = await University.findOne({ _id: id, userId: session.user.id });
    
    if (!university) {
      return NextResponse.json({ message: "University not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(university, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching university" }, { status: 500 });
  }
}
