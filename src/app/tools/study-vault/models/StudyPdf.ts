import mongoose, { Schema, Document } from "mongoose";

export interface IAnnotation {
  id: string;
  page: number;
  tool: string;
  color: string;
  size: number;
  points: any[];
  createdAt?: Date;
}

export interface ISnip {
  id: string;
  attachmentPath: string;
  cloudinaryId?: string | null;
  filename: string;
  note: string;
  page: number;
  rect?: any;
  pdfName?: string | null;
  pdfId?: string | null;
  sourcePdfId?: string | null;
  sourceSnipId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStudyData {
  annotations: IAnnotation[];
  snips: ISnip[];
  updatedAt?: Date | null;
  lastOpenedAt?: Date | null;
}

export interface IStudyPdf extends Document {
  sid: string;
  userId: string;
  projectId?: string | null;
  storageType: "local" | "cloudinary";
  localPath?: string | null;
  filename: string;
  originalName: string;
  uploadedAt: Date;
  sessionCount: number;
  studyData: IStudyData;
}

const AnnotationSchema = new Schema<IAnnotation>(
  {
    id: { type: String, required: true },
    page: { type: Number, default: 1 },
    tool: { type: String, default: "pen" },
    color: { type: String, default: "#1e1e1e" },
    size: { type: Number, default: 3 },
    points: { type: [Schema.Types.Mixed] as any, default: [] },
    createdAt: { type: Date, default: null },
  },
  { _id: false }
);

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

const StudyDataSchema = new Schema<IStudyData>(
  {
    annotations: { type: [AnnotationSchema], default: [] },
    snips: { type: [SnipSchema], default: [] },
    updatedAt: { type: Date, default: null },
    lastOpenedAt: { type: Date, default: null },
  },
  { _id: false }
);

const StudyPdfSchema = new Schema<IStudyPdf>(
  {
    sid: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    projectId: { type: String, default: null, index: true },
    storageType: { type: String, enum: ["local", "cloudinary"], default: "local" },
    localPath: { type: String, default: null },
    filename: { type: String, default: "" },
    originalName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    sessionCount: { type: Number, default: 0 },
    studyData: { type: StudyDataSchema, default: () => ({}) },
  },
  { timestamps: true, collection: "studypdfs" }
);

StudyPdfSchema.index({ userId: 1, uploadedAt: -1 });

export default mongoose.models.StudyPdf || mongoose.model<IStudyPdf>("StudyPdf", StudyPdfSchema);
