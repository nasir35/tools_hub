import mongoose, { Schema, Document } from "mongoose";
import { ISnip } from "./StudyPdf";

export interface IStudySession extends Document {
  ssid: string;
  userId: string;
  projectId?: string | null;
  title: string;
  startedAt: Date;
  endedAt?: Date | null;
  snips: ISnip[];
}

const SnipSchema = new Schema<ISnip>(
  {
    id: { type: String, required: true },
    attachmentPath: { type: String, default: "" },
    cloudinaryId: { type: String, default: null },
    filename: { type: String, default: "" },
    note: { type: String, default: "" },
    page: { type: Number, default: 1 },
    rect: { type: Schema.Types.Mixed, default: null },
    pdfName: { type: String, default: null },
    pdfId: { type: String, default: null },
    sourcePdfId: { type: String, default: null },
    sourceSnipId: { type: String, default: null },
    createdAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
  },
  { _id: false }
);

const StudySessionSchema = new Schema<IStudySession>(
  {
    ssid: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    projectId: { type: String, default: null },
    title: { type: String, default: "Study Session" },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    snips: { type: [SnipSchema], default: [] },
  },
  { timestamps: true, collection: "studysessions" }
);

StudySessionSchema.index({ userId: 1, startedAt: -1 });

export default mongoose.models.StudySession || mongoose.model<IStudySession>("StudySession", StudySessionSchema);
