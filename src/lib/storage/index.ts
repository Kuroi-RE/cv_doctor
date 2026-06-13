import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/constants";
import { randomUUID } from "crypto";
import path from "path";

/**
 * Generate a unique, safe storage path for a CV file.
 * Format: {userId}/{uuid}-{sanitizedFilename}
 */
export function generateStoragePath(
  userId: string,
  originalFileName: string
): string {
  const ext = path.extname(originalFileName).toLowerCase();
  const uniqueId = randomUUID();
  return `${userId}/${uniqueId}${ext}`;
}

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the stored file path on success.
 */
export async function uploadCvToStorage(
  buffer: Buffer,
  filePath: string,
  mimeType: string
): Promise<string> {
  const supabase = await createClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return filePath;
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteCvFromStorage(filePath: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error(`Storage delete failed for ${filePath}:`, error.message);
  }
}

/**
 * Get a temporary signed URL for a stored CV file.
 */
export async function getCvSignedUrl(
  filePath: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}
