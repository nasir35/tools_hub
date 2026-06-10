import mongoose from "mongoose";

const ToolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    iconName: {
      type: String,
      required: true,
      default: "Wrench",
    },
    href: {
      type: String,
      required: true,
      unique: true,
    },
    color: {
      type: String,
      required: true,
      default: "bg-blue-500",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Tool || mongoose.model("Tool", ToolSchema);
