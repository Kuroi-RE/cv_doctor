import mammoth from "mammoth";
import path from "path";

/**
 * Extract plain text from a PDF buffer using pdf-parse v2 (dynamically imported).
 */
async function parsePdf(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid loading pdfjs-dist at build time
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

/**
 * Extract plain text from a DOCX buffer.
 */
async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Unified CV text extraction — routes to the correct parser based on file extension / MIME type.
 * Returns plain text or throws a descriptive error.
 */
export async function extractCvText(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".pdf" || mimeType === "application/pdf") {
    return parsePdf(buffer);
  }

  if (
    ext === ".docx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return parseDocx(buffer);
  }

  throw new Error(
    `Unsupported file type: ${ext || mimeType}. Only PDF and DOCX are supported.`
  );
}
