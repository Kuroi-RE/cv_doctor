import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  TrendingUp,
  FileText,
  BookOpen,
  Target,
  MessageSquare,
  ClipboardList,
} from "lucide-react";

interface AnalysisDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisDetailPage({
  params,
}: AnalysisDetailPageProps) {
  const { id } = await params;
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

  // Fetch analysis result
  const { data: analysis } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("id", id)
    .single();

  if (!analysis) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-xl border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000000]">
          <XCircle className="mx-auto h-16 w-16 text-red-500" strokeWidth={2} />
          <h1 className="mt-4 text-2xl font-black text-black">
            Analysis Not Found
          </h1>
          <p className="mt-2 text-gray-600">
            This analysis result doesn&apos;t exist or you don&apos;t have
            access to it.
          </p>
          <Link
            href="/history"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border-3 border-black bg-yellow-300 px-5 py-2.5 text-sm font-bold shadow-[3px_3px_0px_0px_#000000] transition-all hover:shadow-[1px_1px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  // Fetch the related CV
  const { data: cv } = await supabase
    .from("cvs")
    .select("original_file_name, created_at")
    .eq("id", analysis.cv_id)
    .single();

  // Fetch recommendations
  const { data: recommendations } = await supabase
    .from("recommendation_items")
    .select("*")
    .eq("analysis_result_id", analysis.id)
    .order("priority", { ascending: true });

  const aspectScores = analysis.aspect_scores as Record<string, number>;
  const highlights = (analysis.highlights as string[]) || [];
  const issues = (analysis.issues as string[]) || [];
  const overallScore = analysis.overall_score;

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-300 border-green-600";
    if (score >= 60) return "bg-yellow-300 border-yellow-600";
    if (score >= 40) return "bg-orange-300 border-orange-600";
    return "bg-red-300 border-red-600";
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return "text-green-700";
    if (score >= 60) return "text-yellow-700";
    if (score >= 40) return "text-orange-700";
    return "text-red-700";
  };

  const aspectIcons: Record<string, React.ReactNode> = {
    structure: <FileText className="h-5 w-5" strokeWidth={2.5} />,
    content: <BookOpen className="h-5 w-5" strokeWidth={2.5} />,
    relevance: <Target className="h-5 w-5" strokeWidth={2.5} />,
    language: <MessageSquare className="h-5 w-5" strokeWidth={2.5} />,
    completeness: <ClipboardList className="h-5 w-5" strokeWidth={2.5} />,
  };

  const priorityStyles: Record<string, string> = {
    high: "border-red-500 bg-red-50",
    medium: "border-yellow-500 bg-yellow-50",
    low: "border-green-500 bg-green-50",
  };

  const priorityBadge: Record<string, string> = {
    high: "bg-red-200 text-red-800 border-red-500",
    medium: "bg-yellow-200 text-yellow-800 border-yellow-500",
    low: "bg-green-200 text-green-800 border-green-500",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/history"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 transition-colors hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={3} />
        Back to History
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
          Analysis Results
        </h1>
        {cv && (
          <p className="mt-1 text-sm font-medium text-gray-500">
            {cv.original_file_name} —{" "}
            {new Date(cv.created_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Overall Score + Summary */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Score card */}
        <div className="flex flex-col items-center justify-center rounded-xl border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000000] lg:col-span-1">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">
            Overall Score
          </p>
          <div
            className={`flex h-36 w-36 items-center justify-center rounded-2xl border-4 ${getScoreColor(overallScore)} shadow-[6px_6px_0px_0px_#000000]`}
          >
            <span
              className={`text-5xl font-black ${getScoreTextColor(overallScore)}`}
            >
              {overallScore}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-400">out of 100</p>
        </div>

        {/* Summary + aspect scores */}
        <div className="rounded-xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_#000000] lg:col-span-2">
          <h2 className="mb-3 text-lg font-black text-black">Summary</h2>
          <p className="mb-6 text-sm font-medium leading-relaxed text-gray-700">
            {analysis.summary}
          </p>

          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
            Aspect Scores
          </h3>
          <div className="space-y-3">
            {Object.entries(aspectScores).map(([key, score]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-gray-100">
                  {aspectIcons[key] || (
                    <Star className="h-4 w-4" strokeWidth={2.5} />
                  )}
                </div>
                <span className="w-24 text-sm font-bold capitalize text-black">
                  {key}
                </span>
                <div className="flex-1">
                  <div className="h-5 overflow-hidden rounded-full border-2 border-black bg-gray-100">
                    <div
                      className={`h-full rounded-full ${getScoreColor(score)} transition-all`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
                <span
                  className={`w-10 text-right text-sm font-black ${getScoreTextColor(score)}`}
                >
                  {score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Highlights & Issues */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Highlights */}
        <div className="rounded-xl border-4 border-black bg-green-50 p-6 shadow-[6px_6px_0px_0px_#000000]">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-green-800">
            <CheckCircle2 className="h-5 w-5" strokeWidth={3} />
            Highlights
          </h2>
          <ul className="space-y-2">
            {highlights.map((h, i) => (
              <li
                key={i}
                className="rounded-lg border-2 border-green-300 bg-white px-3 py-2 text-sm font-medium text-green-900"
              >
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Issues */}
        <div className="rounded-xl border-4 border-black bg-red-50 p-6 shadow-[6px_6px_0px_0px_#000000]">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-red-800">
            <AlertTriangle className="h-5 w-5" strokeWidth={3} />
            Issues Found
          </h2>
          <ul className="space-y-2">
            {issues.map((issue, i) => (
              <li
                key={i}
                className="rounded-lg border-2 border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-900"
              >
                {issue}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="rounded-xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_#000000]">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-black">
            <TrendingUp className="h-6 w-6" strokeWidth={3} />
            Recommendations
          </h2>
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className={`rounded-xl border-3 p-4 ${priorityStyles[rec.priority] || "border-gray-300 bg-gray-50"}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                    {rec.section_name}
                  </span>
                  <span
                    className={`rounded-full border-2 px-2.5 py-0.5 text-xs font-bold uppercase ${priorityBadge[rec.priority] || ""}`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p className="mb-1 text-sm font-bold text-black">{rec.issue}</p>
                <p className="text-sm font-medium text-gray-700">
                  {rec.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
