import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    mimeType: {
      type: String,
      required: true,
      enum: ["application/pdf"],
    },

    fileSize: {
      type: Number,
      required: true,
      min: 1,
    },

    pageCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    extractedText: {
      type: String,
      required: true,
    },

    characterCount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["processed", "failed"],
      default: "processed",
      required: true,
    },

    processingError: {
      type: String,
      default: null,
    },

    sourceType: {
      type: String,
      enum: ["pdf"],
      default: "pdf",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

documentSchema.index({
  createdAt: -1,
});

documentSchema.index({
  originalName: 1,
});

const Document = mongoose.model(
  "Document",
  documentSchema,
);

export default Document;