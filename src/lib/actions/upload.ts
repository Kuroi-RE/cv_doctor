"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadFileSchema } from "@/lib/validations/upload";
import {
  generateStoragePath,
  uploadCvToStorage,
  deleteCvFromStorage,
} from "@/lib/storage";
import { extractCvText } from "@/lib/parser";
import { CV_STATUS } from "@/lib/constants";
import { runAnalysisAfterUpload } from "@/lib/actions/analysis";

export type UploadActionState = {
  error?: string;
  success?: string;
  cvId?: string;
  status?: string;
};

/**
 * Upload CV server action — orchestrates:
 * 1. Auth check
 * 2. File validation
 * 3. Storage upload
 * 4. DB record creation (status: uploaded)
 * 5. Text extraction (status: parsing)
 * 6. Update DB with parsed text (status: completed for now — analysis will be wired later)
 */
export async function uploadCvAction(
  _prevState: UploadActionState,
  formData: FormData
): Promise<UploadActionState> {
  const supabase = await createClient();

  // 1. Auth check — try getSession (reliable in actions) then getUser
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("[upload] getSession error:", sessionError.message);
    return { error: `Auth error: ${sessionError.message}` };
  }

  const user = session?.user;

  if (!user) {
    // Fallback: try getUser() in case getSession didn't work
    const {
      data: { user: fallbackUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !fallbackUser) {
      console.error("[upload] getUser fallback error:", userError?.message);
      return { error: "You must be logged in to upload a CV." };
    }

    // Use fallback user for the rest
    return await processUpload(supabase, fallbackUser, formData);
  }

  return await processUpload(supabase, user, formData);
}

async function processUpload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> },
  formData: FormData
): Promise<UploadActionState> {
  // 2. Get or create profile
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) {
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        auth_user_id: user.id,
        full_name: user.user_metadata?.full_name || "",
        email: user.email || "",
        role: "user",
      })
      .select("*")
      .single();

    if (insertError || !newProfile) {
      console.error("[upload] Profile insert error:", insertError?.message, insertError?.code);
      return { error: `Could not create profile: ${insertError?.message || "unknown error"}` };
    }

    profile = newProfile;
  }

  // 3. Extract and validate file
  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return { error: "No file provided." };
  }

  const validation = uploadFileSchema.safeParse({
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
  });

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  // 4. Read file buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 5. Generate storage path and upload to storage
  const storedPath = generateStoragePath(profile.id, file.name);

  let cvId: string | undefined;

  try {
    await uploadCvToStorage(buffer, storedPath, file.type);

    // 6. Create DB record with status: uploaded
    const { data: cvRecord, error: cvError } = await supabase
      .from("cvs")
      .insert({
        user_id: profile.id,
        original_file_name: file.name,
        stored_file_path: storedPath,
        file_type: file.name.split(".").pop() || "",
        mime_type: file.type,
        file_size: file.size,
        status: CV_STATUS.UPLOADED,
      })
      .select("id")
      .single();

    if (cvError || !cvRecord) {
      await deleteCvFromStorage(storedPath);
      return { error: `Failed to save CV record: ${cvError?.message}` };
    }

    cvId = cvRecord.id;

    // 7. Create analysis log entry
    await supabase.from("analysis_logs").insert({
      cv_id: cvId,
      user_id: profile.id,
      status: CV_STATUS.UPLOADED,
      message: "CV uploaded successfully",
    });

    // 8. Parse text
    await supabase
      .from("cvs")
      .update({ status: CV_STATUS.PARSING })
      .eq("id", cvId);

    const parsedText = await extractCvText(buffer, file.name, file.type);

    if (!parsedText || parsedText.trim().length === 0) {
      await supabase
        .from("cvs")
        .update({ status: CV_STATUS.FAILED })
        .eq("id", cvId);

      await supabase.from("analysis_logs").insert({
        cv_id: cvId,
        user_id: profile.id,
        status: CV_STATUS.FAILED,
        message: "CV text extraction returned empty result",
        error_message:
          "Could not extract any text from the uploaded document.",
      });

      return {
        error:
          "Could not extract text from this file. Please ensure it's a valid PDF or DOCX with selectable text.",
        cvId,
      };
    }

    // 9. Update with parsed text, then trigger AI analysis
    await supabase
      .from("cvs")
      .update({ parsed_text: parsedText })
      .eq("id", cvId);

    // 10. Run AI analysis (updates CV status to analyzing → completed/failed)
    if (!cvId) {
      throw new Error("CV ID is missing after record creation.");
    }
    await runAnalysisAfterUpload(cvId, profile.id, parsedText);

    revalidatePath("/dashboard");
    revalidatePath("/history");

    return {
      success: "CV uploaded, parsed, and analyzed successfully!",
      cvId,
      status: CV_STATUS.COMPLETED,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[upload] Full error:", errorMsg);

    // If cvId was created before the error, mark it failed so the user sees it in history.
    if (cvId) {
      await supabase
        .from("cvs")
        .update({ status: CV_STATUS.FAILED })
        .eq("id", cvId);

      await supabase.from("analysis_logs").insert({
        cv_id: cvId,
        user_id: profile.id,
        status: CV_STATUS.FAILED,
        message: "Upload or parsing failed",
        error_message: errorMsg,
      });
    }

    // Always clean up the orphaned storage file
    await deleteCvFromStorage(storedPath);

    return {
      error: errorMsg || "An unexpected error occurred during upload.",
    };
  }
}
