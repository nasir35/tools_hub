import mongoose from "mongoose";

const SharedVocabLinkSchema = new mongoose.Schema(
  {
    shareId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    sharedDates: {
      type: [String], // Array of date strings like "Oct 24, 2023". Empty array means "All Dates"
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

delete mongoose.models.SharedVocabLink;
export default mongoose.models.SharedVocabLink || mongoose.model("SharedVocabLink", SharedVocabLinkSchema);
