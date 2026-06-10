import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import SharedVocabLink from "@/models/SharedVocabLink";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sharedDates } = await req.json();
    await dbConnect();
    
    // Generate a simple 8-character alphanumeric string
    const shareId = Math.random().toString(36).substring(2, 10);
    
    const newLink = await SharedVocabLink.create({
      shareId,
      userId: session.user.id,
      authorName: session.user.name || "A Student",
      sharedDates: sharedDates || []
    });

    return NextResponse.json({ shareId: newLink.shareId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error creating share link" }, { status: 500 });
  }
}
