import { PDFParse } from "pdf-parse";
import { UPLOAD_CONFIG } from "../config/upload.config.js";

function normalizeExtractedText(text) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractTextFromPdf(
  pdfBuffer,
) {
  if (!Buffer.isBuffer(pdfBuffer)) {
    throw new Error(
      "A valid PDF buffer is required",
    );
  }

  const parser = new PDFParse({
    data: pdfBuffer,
  });

  try {
    const result = await parser.getText();

    const extractedText =
      normalizeExtractedText(
        result.text || "",
      );

    if (!extractedText) {
      const error = new Error(
        "No readable text was found in the PDF",
      );

      error.statusCode = 422;

      throw error;
    }

    if (
      extractedText.length >
      UPLOAD_CONFIG.MAX_EXTRACTED_TEXT_LENGTH
    ) {
      const error = new Error(
        "Extracted PDF text is too large",
      );

      error.statusCode = 413;

      throw error;
    }

    return {
      text: extractedText,

      pageCount:
        result.total ??
        result.pages?.length ??
        0,

      characterCount:
        extractedText.length,
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const pdfError = new Error(
      "Unable to read the uploaded PDF",
    );

    pdfError.statusCode = 422;
    pdfError.cause = error;

    throw pdfError;
  } finally {
    await parser.destroy();
  }
}