import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import University from "@/models/University";

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
