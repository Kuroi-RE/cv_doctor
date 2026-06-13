import { createClient } from "@/lib/supabase/server";
import { Upload, FileSearch, History, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user!.id)
    .single();

  // Get CV count
  const { count: cvCount } = await supabase
    .from("cvs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile?.id || "");

  // Get latest analysis score
  const { data: latestAnalysis } = await supabase
    .from("cvs")
    .select("analysis_results(overall_score, created_at)")
    .eq("user_id", profile?.id || "")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const latestScore =
    (latestAnalysis?.analysis_results as { overall_score?: number })
      ?.overall_score ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
          Welcome back, {profile?.full_name || "User"}! 👋
        </h1>
        <p className="mt-2 text-base font-medium text-gray-600">
          Ready to improve your CV? Upload a new one or check your analysis
          history.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000000]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border-3 border-black bg-yellow-300 shadow-[3px_3px_0px_0px_#000000]">
              <Upload className="h-6 w-6" strokeWidth={3} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
                CVs Uploaded
              </p>
              <p className="text-2xl font-black text-black">{cvCount ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000000]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border-3 border-black bg-cyan-300 shadow-[3px_3px_0px_0px_#000000]">
              <TrendingUp className="h-6 w-6" strokeWidth={3} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
                Latest Score
              </p>
              <p className="text-2xl font-black text-black">
                {latestScore !== null ? `${latestScore}/100` : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000000]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border-3 border-black bg-green-300 shadow-[3px_3px_0px_0px_#000000]">
              <FileSearch className="h-6 w-6" strokeWidth={3} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
                Role
              </p>
              <p className="text-2xl font-black capitalize text-black">
                {profile?.role || "user"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/upload"
          className="group flex items-center gap-4 rounded-xl border-4 border-black bg-yellow-300 p-6 shadow-[6px_6px_0px_0px_#000000] transition-all hover:shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[3px] hover:translate-y-[3px]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border-3 border-black bg-white shadow-[3px_3px_0px_0px_#000000]">
            <Upload className="h-7 w-7" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-xl font-black text-black">Upload New CV</h2>
            <p className="text-sm font-medium text-black/70">
              Get instant AI-powered feedback
            </p>
          </div>
        </Link>

        <Link
          href="/history"
          className="group flex items-center gap-4 rounded-xl border-4 border-black bg-cyan-300 p-6 shadow-[6px_6px_0px_0px_#000000] transition-all hover:shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[3px] hover:translate-y-[3px]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border-3 border-black bg-white shadow-[3px_3px_0px_0px_#000000]">
            <History className="h-7 w-7" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-xl font-black text-black">View History</h2>
            <p className="text-sm font-medium text-black/70">
              Review past analysis results
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
