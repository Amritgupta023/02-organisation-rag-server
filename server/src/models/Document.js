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

    chunkCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    chunkSize: {
      type: Number,
      default: null,
      min: 1,
    },

    chunkOverlap: {
      type: Number,
      default: null,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "processing",
        "processed",
        "failed",
      ],
      default: "processing",
      required: true,
    },

    processingError: {
      type: String,
      default: null,
    },

    embeddingStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "partially_failed",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    embeddedChunkCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    failedChunkCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    embeddingModel: {
      type: String,
      default: null,
    },

    embeddingDimensions: {
      type: Number,
      default: null,
    },

    embeddedAt: {
      type: Date,
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

documentSchema.index({
  status: 1,
});

const Document = mongoose.model(
  "Document",
  documentSchema,
);

export default Document;