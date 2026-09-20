import mongoose, { Schema, Document } from "mongoose";

export interface IAttachment {
  filename?: string;
  type?: string;
  path: string;
  folder?: string | null;
  publicId?: string | null;
  size?: number;
}

export interface INote extends Document {
  nid: string;
  userId: string;
  projectId?: string | null;
  title: string;
  content: string;
  attachments: IAttachment[];
  attachmentFolder?: string | null;
  thumbnail?: string | null;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    filename: { type: String, default: "" },
    type: { type: String, default: "" },
    path: { type: String, required: true },
    folder: { type: String, default: null },
    publicId: { type: String, default: null },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const NoteSchema = new Schema<INote>(
  {
    nid: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    projectId: { type: String, default: null, index: true },
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    attachments: { type: [AttachmentSchema], default: [] },
    attachmentFolder: { type: String, default: null },
    thumbnail: { type: String, default: null },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "notes" }
);

NoteSchema.index({ userId: 1, updatedAt: -1 });
NoteSchema.index({ userId: 1, projectId: 1 });

export default mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);
