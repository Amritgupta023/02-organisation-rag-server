import {
  getDocumentById,
  getChunksByDocumentId,
} from "../services/document.service.js";

export async function getDocumentChunksController(
  req,
  res,
) {
  try {
    const { documentId } = req.params;

    const document =
      await getDocumentById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const chunks =
      await getChunksByDocumentId(
        documentId,
      );

    const formattedChunks = chunks.map(
      (chunk) => ({
        id: chunk._id,
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        characterCount:
          chunk.characterCount,
        startCharacter:
          chunk.startCharacter,
        endCharacter:
          chunk.endCharacter,
        metadata: chunk.metadata,
        embeddingStatus:
          chunk.embeddingStatus,
        createdAt: chunk.createdAt,
      }),
    );

    return res.status(200).json({
      success: true,

      data: {
        document: {
          id: document._id,
          originalName:
            document.originalName,
          chunkCount:
            document.chunkCount,
          chunkSize:
            document.chunkSize,
          chunkOverlap:
            document.chunkOverlap,
        },

        chunks: formattedChunks,
      },
    });
  } catch (error) {
    console.error(
      "Get document chunks error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load document chunks",
    });
  }
}