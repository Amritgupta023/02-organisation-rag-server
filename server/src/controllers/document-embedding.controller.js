import {
  embedDocumentChunks,
} from "../services/document-embedding.service.js";

export async function embedDocumentController(
  req,
  res,
) {
  try {
    const { documentId } =
      req.params;

    const force =
      req.body?.force === true;

    const result =
      await embedDocumentChunks(
        documentId,
        {
          force,
        },
      );

    return res.status(200).json({
      success: true,

      message:
        result.status === "completed"
          ? "Document embeddings generated successfully"
          : "Document embedding completed with errors",

      data: result,
    });
  } catch (error) {
    console.error(
      "Embed document error:",
      error,
    );

    return res
      .status(error.statusCode || 500)
      .json({
        success: false,

        message:
          error.message ||
          "Unable to generate document embeddings",
      });
  }
}