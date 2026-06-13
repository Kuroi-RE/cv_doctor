export const APP_NAME = "CV Doctor";
export const APP_DESCRIPTION = "AI-Based CV Assessment Website";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const ALLOWED_FILE_EXTENSIONS = [".pdf", ".docx"];

export const CV_STATUS = {
  UPLOADED: "uploaded",
  PARSING: "parsing",
  ANALYZING: "analyzing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const;

export const STORAGE_BUCKET = "cv-documents";
