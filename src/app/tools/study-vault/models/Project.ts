import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  pid: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    pid: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#6366f1" },
  },
  { timestamps: true, collection: "projects" }
);

ProjectSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
