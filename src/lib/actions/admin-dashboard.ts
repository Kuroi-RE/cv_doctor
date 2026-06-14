"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAuthUser } from "@/lib/auth";

export type DashboardLog = {
  id: string;
  cv_id: string;
  user_id: string;
  status: string;
  message: string;
  provider?: string | null;
  error_message?: string | null;
  created_at: string;
};

export type DashboardStats = {
  totalCvs: number;
  totalAnalyses: number;
  totalUsers: number;
  activeKeys: Array<{
    provider: string;
    model: string;
    is_active: boolean;
  }>;
  recentLogs: DashboardLog[];
};

function assertSuperadmin(role?: string | null): void {
  if (role !== "superadmin") {
    throw new Error("Forbidden: superadmin access required.");
  }
}

export async function getAdminDashboardStats(): Promise<{
  stats?: DashboardStats;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  assertSuperadmin(profile?.role);

  const service = createServiceClient();

  // Count totals
  const [cvsRes, analysesRes, usersRes, keysRes, logsRes] = await Promise.all([
    service.from("cvs").select("id", { count: "exact", head: true }),
    service.from("analysis_results").select("id", { count: "exact", head: true }),
    service.from("profiles").select("id", { count: "exact", head: true }),
    service
      .from("ai_provider_keys")
      .select("provider, model, is_active")
      .order("provider", { ascending: true }),
    service
      .from("analysis_logs")
      .select("id, cv_id, user_id, status, message, provider, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return {
    stats: {
      totalCvs: cvsRes.count ?? 0,
      totalAnalyses: analysesRes.count ?? 0,
      totalUsers: usersRes.count ?? 0,
      activeKeys: keysRes.data || [],
      recentLogs: logsRes.data || [],
    },
  };
}
