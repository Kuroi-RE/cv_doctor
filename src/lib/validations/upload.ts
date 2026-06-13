import { z } from "zod";
import {
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  ALLOWED_FILE_EXTENSIONS,
} from "@/lib/constants";

/**
 * Server-side file validation for CV uploads.
 * Validates extension, MIME type, and size.
 */
export const uploadFileSchema = z.object({
  fileName: z
    .string()
    .min(1, "File name is required")
    .refine(
      (name) => {
        const ext = name.substring(name.lastIndexOf(".")).toLowerCase();
        return ALLOWED_FILE_EXTENSIONS.includes(ext);
      },
      { message: `Only ${ALLOWED_FILE_EXTENSIONS.join(", ")} files are allowed` }
    ),
  mimeType: z.string().refine(
    (type) => ALLOWED_FILE_TYPES.includes(type),
    { message: "Unsupported file type. Only PDF and DOCX are allowed." }
  ),
  fileSize: z
    .number()
    .positive("File must not be empty")
    .max(MAX_FILE_SIZE, `File size must be at most ${MAX_FILE_SIZE / 1024 / 1024}MB`),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;

/**
 * Client-side validation helper for the upload form.
 * Returns an error message string or null if valid.
 */
export function validateCvFile(file: File): string | null {
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

  if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
    return `Unsupported file type: ${ext}. Only ${ALLOWED_FILE_EXTENSIONS.join(", ")} are allowed.`;
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type) && ext !== ".docx" && ext !== ".pdf") {
    return `Unsupported MIME type: ${file.type}. Please upload a PDF or DOCX file.`;
  }

  if (file.size === 0) {
    return "File is empty. Please upload a valid CV document.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
  }

  return null;
}
