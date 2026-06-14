import mammoth from "mammoth";
import path from "path";
import PDFParser from "pdf2json";

/**
 * Extract plain text from a PDF buffer using pdf2json.
 * Pure JavaScript — no canvas, no workers, no DOMMatrix.
 */
function parsePdf(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = errData as any;
      reject(new Error(raw?.parserError || "PDF parsing failed"));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pages: any[] = (pdfData.Pages as unknown as any[]) || [];
        const lines: string[] = [];

        for (const page of pages) {
          const texts = (page.Texts as Array<Record<string, unknown>>) || [];
          const pageLines: Record<number, string[]> = {};

          for (const text of texts) {
            const runs = (text.R as Array<Record<string, string>>) || [];
            const y = (text.y as number) ?? 0;
            const row = Math.round(y * 10) / 10; // Group by rounded Y-coordinate
            if (!pageLines[row]) pageLines[row] = [];

            for (const run of runs) {
              const raw = run.T || "";
              // pdf2json URL-encodes text items
              const decoded = raw.includes("%")
                ? decodeURIComponent(raw)
                : raw;
              pageLines[row].push(decoded);
            }
          }

          // Sort lines by Y coordinate (top-to-bottom) and join
          const sortedRows = Object.keys(pageLines)
            .map(Number)
            .sort((a, b) => a - b);

          for (const row of sortedRows) {
            const lineText = pageLines[row].join("").trim();
            if (lineText) lines.push(lineText);
          }
        }

        resolve(lines.join("\n"));
      } catch (e) {
        reject(e);
      }
    });

    pdfParser.parseBuffer(buffer);
  });
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
