import multer from "multer";
import { UPLOAD_CONFIG } from "../config/upload.config.js";

export function errorMiddleware(
  error,
  req,
  res,
  next,
) {
  console.error("Application error:", error);

  if (
    error instanceof multer.MulterError
  ) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: `PDF cannot exceed ${
          UPLOAD_CONFIG.MAX_FILE_SIZE /
          (1024 * 1024)
        } MB`,
      });
    }

    if (
      error.code ===
      "LIMIT_UNEXPECTED_FILE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Unexpected file field. Use 'document'.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res
    .status(error.statusCode || 500)
    .json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
}