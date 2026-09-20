import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import StudyPdf from "@/app/tools/study-vault/models/StudyPdf";
import { toPlainPdf } from "@/app/tools/study-vault/utils/apiHelper";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const studyData = await req.json();
    await dbConnect();
    const pdf = await StudyPdf.findOne({ sid: id, userId: session.user.id });
    if (!pdf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    pdf.studyData = {
      ...pdf.studyData.toObject(),
      ...studyData,
      updatedAt: new Date(),
    };
    pdf.markModified("studyData");
    await pdf.save();

    return NextResponse.json(toPlainPdf(pdf), { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
