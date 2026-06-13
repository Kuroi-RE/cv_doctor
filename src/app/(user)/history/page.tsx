import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default async function AnalysisListPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Fetch CVs with their analysis results
  const { data: cvs } = await supabase
    .from("cvs")
    .select(
      "id, original_file_name, status, created_at, analysis_results(id, overall_score, summary)"
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const scoreColor = (score: number) => {
    if (score >= 80) return "bg-green-300 text-green-800 border-green-600";
    if (score >= 60) return "bg-yellow-300 text-yellow-800 border-yellow-600";
    if (score >= 40) return "bg-orange-300 text-orange-800 border-orange-600";
    return "bg-red-300 text-red-800 border-red-600";
  };

  const statusStyles: Record<string, string> = {
    uploaded: "bg-blue-100 text-blue-800 border-blue-400",
    parsing: "bg-purple-100 text-purple-800 border-purple-400",
    analyzing: "bg-cyan-100 text-cyan-800 border-cyan-400",
    completed: "bg-green-100 text-green-800 border-green-400",
    failed: "bg-red-100 text-red-800 border-red-400",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
            Analysis History
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Review your past CV analyses and recommendations
          </p>
        </div>
        <Link
          href="/upload"
          className="hidden items-center gap-2 rounded-xl border-3 border-black bg-yellow-300 px-5 py-2.5 text-sm font-bold shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] sm:inline-flex"
        >
          Upload New
          <ArrowRight className="h-4 w-4" strokeWidth={3} />
        </Link>
      </div>

      {!cvs || cvs.length === 0 ? (
        <div className="rounded-xl border-4 border-black bg-white p-12 text-center shadow-[8px_8px_0px_0px_#000000]">
          <FileText className="mx-auto h-16 w-16 text-gray-300" strokeWidth={1.5} />
          <h2 className="mt-4 text-xl font-black text-black">No Analyses Yet</h2>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Upload a CV to get your first AI-powered analysis.
          </p>
          <Link
            href="/upload"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border-3 border-black bg-cyan-300 px-6 py-3 text-sm font-bold shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            Upload Your CV
            <ArrowRight className="h-4 w-4" strokeWidth={3} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cvs.map((cv) => {
            const analysis = Array.isArray(cv.analysis_results)
              ? cv.analysis_results[0]
              : (cv.analysis_results as Record<string, unknown> | null);
            const score =
              analysis && typeof analysis === "object" && "overall_score" in analysis
                ? (analysis.overall_score as number)
                : null;
            const summary =
              analysis && typeof analysis === "object" && "summary" in analysis
                ? (analysis.summary as string)
                : null;
            const analysisId =
              analysis && typeof analysis === "object" && "id" in analysis
                ? (analysis.id as string)
                : null;

            return (
              <div
                key={cv.id}
                className="rounded-xl border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000000] transition-all hover:shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* File info */}
                  <div className="flex flex-1 items-start gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border-3 border-black bg-gray-100">
                      <FileText className="h-6 w-6 text-gray-500" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-black">
                        {cv.original_file_name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(cv.created_at).toLocaleDateString()}
                        </span>
                        <span
                          className={`rounded-full border-2 px-2 py-0.5 text-xs font-bold uppercase ${statusStyles[cv.status] || "bg-gray-100 text-gray-600 border-gray-300"}`}
                        >
                          {cv.status}
                        </span>
                      </div>
                      {summary && (
                        <p className="mt-1.5 line-clamp-2 text-xs font-medium text-gray-500">
                          {summary}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Score + Action */}
                  <div className="flex items-center gap-4 sm:flex-shrink-0">
                    {score !== null ? (
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-xl border-3 border-black font-black shadow-[3px_3px_0px_0px_#000000] ${scoreColor(score)}`}
                      >
                        {score}
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border-3 border-dashed border-gray-300 text-xs font-bold text-gray-400">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                    )}

                    {analysisId && cv.status === "completed" && (
                      <Link
                        href={`/analysis/${analysisId}`}
                        className="flex items-center gap-1.5 rounded-lg border-3 border-black bg-yellow-300 px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#000000] transition-all hover:shadow-[1px_1px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px]"
                      >
                        <TrendingUp className="h-4 w-4" strokeWidth={3} />
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
