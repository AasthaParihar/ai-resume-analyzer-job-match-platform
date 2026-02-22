import mongoose from "mongoose";

const resumeEmbeddingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeHash: {
      type: String,
      required: true,
      index: true,
    },
    resumeName: {
      type: String,
      default: "",
    },
    embedding: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true }
);

resumeEmbeddingSchema.index({ userId: 1, resumeHash: 1 }, { unique: true });

export default mongoose.model("ResumeEmbedding", resumeEmbeddingSchema);
