import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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
 * Uses service-role client to bypass Storage RLS policies.
 * Only call from server actions that already validated auth.
 */
export async function uploadCvToStorage(
  buffer: Buffer,
  filePath: string,
  mimeType: string
): Promise<string> {
  const supabase = createServiceClient();

  // Auto-create bucket if it doesn't exist (production safety net)
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === STORAGE_BUCKET);
  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket(
      STORAGE_BUCKET,
      { public: false }
    );
    if (createError) {
      console.warn("[storage] Bucket auto-create failed:", createError.message);
      // Continue trying upload anyway — it might already exist.
    }
  }

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
  const supabase = createServiceClient();

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
