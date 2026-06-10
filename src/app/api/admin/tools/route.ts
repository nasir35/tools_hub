import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Tool from "@/models/Tool";

export async function GET() {
  try {
    await dbConnect();
    const tools = await Tool.find({}).sort({ createdAt: -1 });
    return NextResponse.json(tools, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching tools" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    await dbConnect();
    const newTool = await Tool.create(data);
    return NextResponse.json(newTool, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error creating tool" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const toolId = searchParams.get("toolId");

    if (!toolId) {
      return NextResponse.json({ message: "Missing Tool ID" }, { status: 400 });
    }

    await dbConnect();
    await Tool.findByIdAndDelete(toolId);
    
    return NextResponse.json({ message: "Tool deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting tool" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { _id, ...updateData } = data;
    
    if (!_id) {
      return NextResponse.json({ message: "Missing Tool ID" }, { status: 400 });
    }

    await dbConnect();
    const updatedTool = await Tool.findByIdAndUpdate(_id, updateData, { new: true });
    
    return NextResponse.json(updatedTool, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error updating tool" }, { status: 500 });
  }
}
