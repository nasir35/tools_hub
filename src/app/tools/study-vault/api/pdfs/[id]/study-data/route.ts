import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudyPdf from "@/app/tools/study-vault/models/StudyPdf";
import { toPlainPdf, getStudyVaultUserId } from "@/app/tools/study-vault/utils/apiHelper";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getStudyVaultUserId();
  const { id } = await params;

  try {
    const studyData = await req.json();
    await dbConnect();
    const pdf = await StudyPdf.findOne({ sid: id, userId });
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
