import mongoose from "mongoose";
import Document from "../models/Document.js";

export function isValidDocumentId(documentId) {
  return mongoose.Types.ObjectId.isValid(
    documentId,
  );
}

export async function createDocument({
  originalName,
  mimeType,
  fileSize,
  pageCount,
  extractedText,
  characterCount,
}) {
  return Document.create({
    originalName,
    mimeType,
    fileSize,
    pageCount,
    extractedText,
    characterCount,
    sourceType: "pdf",
    status: "processed",
  });
}

export async function getAllDocuments() {
  return Document.find()
    .select(
      [
        "originalName",
        "mimeType",
        "fileSize",
        "pageCount",
        "characterCount",
        "status",
        "sourceType",
        "createdAt",
        "updatedAt",
      ].join(" "),
    )
    .sort({
      createdAt: -1,
    })
    .lean();
}

export async function getDocumentById(
  documentId,
) {
  if (!isValidDocumentId(documentId)) {
    return null;
  }

  return Document.findById(documentId).lean();
}

export async function deleteDocumentById(
  documentId,
) {
  if (!isValidDocumentId(documentId)) {
    return null;
  }

  return Document.findByIdAndDelete(
    documentId,
  );
}