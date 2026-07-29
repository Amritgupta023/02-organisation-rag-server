import mongoose from "mongoose";

const documentChunkSchema =
  new mongoose.Schema(
    {
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true,
        index: true,
      },

      chunkIndex: {
        type: Number,
        required: true,
        min: 0,
      },

      content: {
        type: String,
        required: true,
        trim: true,
      },

      characterCount: {
        type: Number,
        required: true,
        min: 1,
      },

      startCharacter: {
        type: Number,
        required: true,
        min: 0,
      },

      endCharacter: {
        type: Number,
        required: true,
        min: 1,
      },

      metadata: {
        originalName: {
          type: String,
          required: true,
        },

        sourceType: {
          type: String,
          enum: ["pdf"],
          default: "pdf",
        },

        pageNumber: {
          type: Number,
          default: null,
        },
      },

      /*
       * Level 7 ke liye placeholder.
       * Abhi false hi rahega.
       */
      embeddingStatus: {
        type: String,
        enum: [
          "pending",
          "completed",
          "failed",
        ],
        default: "pending",
      },
    },
    {
      timestamps: true,
    },
  );

documentChunkSchema.index(
  {
    documentId: 1,
    chunkIndex: 1,
  },
  {
    unique: true,
  },
);

documentChunkSchema.index({
  embeddingStatus: 1,
});

const DocumentChunk = mongoose.model(
  "DocumentChunk",
  documentChunkSchema,
);

export default DocumentChunk;