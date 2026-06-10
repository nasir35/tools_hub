import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import SharedVocabLink from "@/models/SharedVocabLink";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const links = await SharedVocabLink.find({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json(links, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching links" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return NextResponse.json({ message: "Missing shareId" }, { status: 400 });
  }

  try {
    await dbConnect();
    await SharedVocabLink.findOneAndDelete({ shareId, userId: session.user.id });
    return NextResponse.json({ message: "Link deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting link" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { shareId, isActive } = await req.json();
    
    if (!shareId || typeof isActive !== "boolean") {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    await dbConnect();
    const updated = await SharedVocabLink.findOneAndUpdate(
      { shareId, userId: session.user.id },
      { isActive },
      { new: true }
    );
    
    if (!updated) {
      return NextResponse.json({ message: "Link not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error updating link" }, { status: 500 });
  }
}
