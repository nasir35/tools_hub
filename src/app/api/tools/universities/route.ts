import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import University from "@/models/University";

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
    const newUniversity = await University.create({
      ...data,
      userId: session.user.id,
    });
    return NextResponse.json(newUniversity, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error saving university" }, { status: 500 });
  }
}
