import mongoose from "mongoose";

const UniversitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    program: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["Researching", "Shortlisted", "Applied", "Accepted", "Rejected"],
      default: "Researching",
    },
    deadline: {
      type: Date,
      required: false,
    },
    requirements: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [], // Array of base64 strings or URLs
    },
    userId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.University || mongoose.model("University", UniversitySchema);
