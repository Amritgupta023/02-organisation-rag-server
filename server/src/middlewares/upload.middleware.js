import multer from "multer";
import { UPLOAD_CONFIG } from "../config/upload.config.js";

const storage = multer.memoryStorage();

function pdfFileFilter(req, file, callback) {
  const isAllowedMimeType =
    UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(
      file.mimetype,
    );

  const hasPdfExtension =
    file.originalname
      .toLowerCase()
      .endsWith(".pdf");

  if (!isAllowedMimeType || !hasPdfExtension) {
    const error = new Error(
      "Only PDF files are allowed",
    );

    error.statusCode = 400;

    return callback(error);
  }

  return callback(null, true);
}

const upload = multer({
  storage,

  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
    files: 1,
  },

  fileFilter: pdfFileFilter,
});

export const uploadSinglePdf = upload.single(
  UPLOAD_CONFIG.FILE_FIELD_NAME,
);