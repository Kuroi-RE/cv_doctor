import mammoth from "mammoth";
import path from "path";

/**
 * Polyfill browser globals that pdfjs-dist expects in Node.js.
 * DOMMatrix, Path2D, and other Canvas API types are referenced by
 * the display layer even when we only call getText().
 */
function polyfillBrowserGlobals() {
  if (typeof globalThis.DOMMatrix === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    globalThis.DOMMatrix = class DOMMatrix {
      a = 1;
      b = 0;
      c = 0;
      d = 1;
      e = 0;
      f = 0;
      m11 = 1;
      m12 = 0;
      m13 = 0;
      m14 = 0;
      m21 = 0;
      m22 = 1;
      m23 = 0;
      m24 = 0;
      m31 = 0;
      m32 = 0;
      m33 = 1;
      m34 = 0;
      m41 = 0;
      m42 = 0;
      m43 = 0;
      m44 = 1;
      is2D = true;
      isIdentity = true;

      constructor(init?: string | number[]) {
        if (Array.isArray(init)) {
          this.a = init[0] ?? 1;
          this.b = init[1] ?? 0;
          this.c = init[2] ?? 0;
          this.d = init[3] ?? 1;
          this.e = init[4] ?? 0;
          this.f = init[5] ?? 0;
        }
      }

      multiply(): DOMMatrix {
        return this;
      }

      translate(): DOMMatrix {
        return this;
      }

      scale(): DOMMatrix {
        return this;
      }

      rotate(): DOMMatrix {
        return this;
      }

      flipX(): DOMMatrix {
        return this;
      }

      flipY(): DOMMatrix {
        return this;
      }

      inverse(): DOMMatrix {
        return this;
      }

      transformPoint(): { x: number; y: number } {
        return { x: 0, y: 0 };
      }

      toString(): string {
        return "matrix(1, 0, 0, 1, 0, 0)";
      }
    } as unknown as typeof DOMMatrix;
  }

  if (typeof globalThis.Path2D === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    globalThis.Path2D = class Path2D {
      addPath(): void {}
      closePath(): void {}
      moveTo(): void {}
      lineTo(): void {}
      bezierCurveTo(): void {}
      quadraticCurveTo(): void {}
      arc(): void {}
      arcTo(): void {}
      ellipse(): void {}
      rect(): void {}
      roundRect(): void {}
    } as unknown as typeof Path2D;
  }
}

polyfillBrowserGlobals();

/**
 * Extract plain text from a PDF buffer using pdf-parse v2 (dynamically imported).
 */
async function parsePdf(buffer: Buffer): Promise<string> {
  // pdf-parse already lazy-loaded its worker on first use.
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
