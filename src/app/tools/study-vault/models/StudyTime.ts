import mongoose, { Schema, Document } from "mongoose";

export interface IStudyTime extends Document {
  stid: string;
  userId: string;
  pdfId?: string | null;
  pdfName: string;
  sessionId?: string | null;
  duration: number; // seconds
  date: string; // YYYY-MM-DD
}

const StudyTimeSchema = new Schema<IStudyTime>(
  {
    stid: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    pdfId: { type: String, default: null, index: true },
    pdfName: { type: String, default: "" },
    sessionId: { type: String, default: null },
    duration: { type: Number, required: true, min: 0 },
    date: { type: String, required: true },
  },
  { timestamps: true, collection: "studytimes" }
);

StudyTimeSchema.index({ userId: 1, date: -1 });
StudyTimeSchema.index({ userId: 1, pdfId: 1 });

export default mongoose.models.StudyTime || mongoose.model<IStudyTime>("StudyTime", StudyTimeSchema);
