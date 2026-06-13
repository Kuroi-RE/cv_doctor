"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/auth";
import { analyzeCvWithAi } from "@/lib/ai";
import { CV_STATUS } from "@/lib/constants";

export type AnalysisActionState = {
  error?: string;
  success?: string;
  analysisId?: string;
  overallScore?: number;
};

/**
 * Run AI analysis on a parsed CV.
 * Can be called standalone (from a "Analyze" button) or programmatically after upload.
 */
export async function analyzeCvAction(
  _prevState: AnalysisActionState,
  formData: FormData
): Promise<AnalysisActionState> {
  const cvId = formData.get("cvId") as string;
  if (!cvId) {
    return { error: "No CV ID provided." };
  }

  // 1. Auth check + get/create profile
  const supabase = await createClient();
  const { profile, error: profileError } = await getOrCreateProfile(supabase);

  if (!profile) {
    return { error: profileError || "You must be logged in to analyze a CV." };
  }

  // 3. Fetch the CV record — must belong to user and have parsed_text
  const { data: cvRecord, error: cvError } = await supabase
    .from("cvs")
    .select("*")
    .eq("id", cvId)
    .eq("user_id", profile.id)
    .single();

  if (cvError || !cvRecord) {
    return { error: "CV not found or you don't have permission." };
  }

  if (!cvRecord.parsed_text || cvRecord.parsed_text.trim().length === 0) {
    return { error: "This CV has no parsed text to analyze." };
  }

  // 4. Mark as analyzing
  await supabase
    .from("cvs")
    .update({ status: CV_STATUS.ANALYZING })
    .eq("id", cvId);

  await supabase.from("analysis_logs").insert({
    cv_id: cvId,
    user_id: profile.id,
    status: CV_STATUS.ANALYZING,
    message: "Starting AI analysis with OpenAI",
  });

  try {
    // 5. Call OpenAI
    const aiResult = await analyzeCvWithAi(cvRecord.parsed_text);

    // 6. Save analysis_results
    const { data: analysisRecord, error: analysisError } = await supabase
      .from("analysis_results")
      .insert({
        cv_id: cvId,
        overall_score: aiResult.overallScore,
        aspect_scores: aiResult.aspectScores,
        highlights: aiResult.highlights,
        issues: aiResult.issues,
        summary: aiResult.summary,
      })
      .select("id")
      .single();

    if (analysisError || !analysisRecord) {
      throw new Error(
        `Failed to save analysis result: ${analysisError?.message}`
      );
    }

    // 7. Save recommendation_items
    if (aiResult.recommendations.length > 0) {
      const recRows = aiResult.recommendations.map((rec) => ({
        analysis_result_id: analysisRecord.id,
        section_name: rec.sectionName,
        issue: rec.issue,
        suggestion: rec.suggestion,
        priority: rec.priority,
      }));

      const { error: recError } = await supabase
        .from("recommendation_items")
        .insert(recRows);

      if (recError) {
        console.error("Failed to save recommendations:", recError.message);
      }
    }

    // 8. Update CV status to completed
    await supabase
      .from("cvs")
      .update({ status: CV_STATUS.COMPLETED })
      .eq("id", cvId);

    // 9. Log success
    await supabase.from("analysis_logs").insert({
      cv_id: cvId,
      user_id: profile.id,
      status: CV_STATUS.COMPLETED,
      message: `AI analysis completed. Score: ${aiResult.overallScore}/100`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/history");
    revalidatePath(`/analysis/${analysisRecord.id}`);

    return {
      success: `Analysis complete! Your CV scored ${aiResult.overallScore}/100.`,
      analysisId: analysisRecord.id,
      overallScore: aiResult.overallScore,
    };
  } catch (err) {
    // Mark as failed
    await supabase
      .from("cvs")
      .update({ status: CV_STATUS.FAILED })
      .eq("id", cvId);

    await supabase.from("analysis_logs").insert({
      cv_id: cvId,
      user_id: profile.id,
      status: CV_STATUS.FAILED,
      message: "AI analysis failed",
      error_message: err instanceof Error ? err.message : "Unknown error",
    });

    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during analysis.",
    };
  }
}

/**
 * Internal helper to run analysis after upload (called from upload action).
 * Returns the analysis result or throws.
 */
export async function runAnalysisAfterUpload(
  cvId: string,
  userId: string,
  parsedText: string
): Promise<void> {
  const supabase = await createClient();

  // Mark as analyzing
  await supabase
    .from("cvs")
    .update({ status: CV_STATUS.ANALYZING })
    .eq("id", cvId);

  await supabase.from("analysis_logs").insert({
    cv_id: cvId,
    user_id: userId,
    status: CV_STATUS.ANALYZING,
    message: "Starting AI analysis with OpenAI",
  });

  try {
    const aiResult = await analyzeCvWithAi(parsedText);

    const { data: analysisRecord, error: analysisError } = await supabase
      .from("analysis_results")
      .insert({
        cv_id: cvId,
        overall_score: aiResult.overallScore,
        aspect_scores: aiResult.aspectScores,
        highlights: aiResult.highlights,
        issues: aiResult.issues,
        summary: aiResult.summary,
      })
      .select("id")
      .single();

    if (analysisError || !analysisRecord) {
      throw new Error(
        `Failed to save analysis result: ${analysisError?.message}`
      );
    }

    if (aiResult.recommendations.length > 0) {
      const recRows = aiResult.recommendations.map((rec) => ({
        analysis_result_id: analysisRecord.id,
        section_name: rec.sectionName,
        issue: rec.issue,
        suggestion: rec.suggestion,
        priority: rec.priority,
      }));

      await supabase.from("recommendation_items").insert(recRows);
    }

    await supabase
      .from("cvs")
      .update({ status: CV_STATUS.COMPLETED })
      .eq("id", cvId);

    await supabase.from("analysis_logs").insert({
      cv_id: cvId,
      user_id: userId,
      status: CV_STATUS.COMPLETED,
      message: `AI analysis completed. Score: ${aiResult.overallScore}/100`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/history");
  } catch (err) {
    await supabase
      .from("cvs")
      .update({ status: CV_STATUS.FAILED })
      .eq("id", cvId);

    await supabase.from("analysis_logs").insert({
      cv_id: cvId,
      user_id: userId,
      status: CV_STATUS.FAILED,
      message: "AI analysis failed",
      error_message: err instanceof Error ? err.message : "Unknown error",
    });

    throw err;
  }
}
