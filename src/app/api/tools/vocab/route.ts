import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Vocabulary from "@/models/Vocabulary";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const vocabList = await Vocabulary.find({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json(vocabList, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching vocabulary" }, { status: 500 });
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
    const newWord = await Vocabulary.create({
      ...data,
      userId: session.user.id,
    });
    return NextResponse.json(newWord, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error saving word" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Missing ID" }, { status: 400 });
    }

    await dbConnect();
    
    // Ensure the word belongs to the user
    const deletedWord = await Vocabulary.findOneAndDelete({ _id: id, userId: session.user.id });
    
    if (!deletedWord) {
      return NextResponse.json({ message: "Word not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Word deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting word" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { _id, ...updateData } = data;
    
    if (!_id) {
      return NextResponse.json({ message: "Missing Word ID" }, { status: 400 });
    }

    await dbConnect();
    
    // Ensure the word belongs to the user before updating
    const updatedWord = await Vocabulary.findOneAndUpdate(
      { _id, userId: session.user.id }, 
      updateData, 
      { new: true }
    );
    
    if (!updatedWord) {
      return NextResponse.json({ message: "Word not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updatedWord, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error updating word" }, { status: 500 });
  }
}

