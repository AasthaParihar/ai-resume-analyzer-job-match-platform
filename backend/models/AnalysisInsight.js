import mongoose from "mongoose";

const analysisInsightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeName: {
      type: String,
      default: "",
    },
    resumeHash: {
      type: String,
      required: true,
      index: true,
    },
    jdPreview: {
      type: String,
      default: "",
    },
    match_score: {
      type: Number,
      required: true,
    },
    why_score: {
      type: String,
      default: "",
    },
    matched_skills: {
      type: [String],
      default: [],
    },
    missing_skills: {
      type: [String],
      default: [],
    },
    improvement_suggestions: {
      type: [String],
      default: [],
    },
    usedCachedEmbedding: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AnalysisInsight", analysisInsightSchema);
