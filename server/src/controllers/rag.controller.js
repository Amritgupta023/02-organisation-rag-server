import { askRagQuestion } from "../services/rag.service.js";

export async function askRagQuestionController(
  req,
  res,
) {
  try {
    const {
      question,
      documentId,
    } = req.body;

    const result =
      await askRagQuestion({
        question,
        documentId,
      });

    return res.status(200).json({
      success: true,

      data: result,
    });
  } catch (error) {
    console.error(
      "RAG question error:",
      error,
    );

    return res
      .status(
        error.statusCode || 500,
      )
      .json({
        success: false,

        message:
          error.statusCode
            ? error.message
            : "Unable to answer the question from documents",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
  }
}