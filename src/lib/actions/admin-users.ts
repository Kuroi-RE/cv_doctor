"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";

export type AdminUserState = {
  error?: string;
  success?: string;
};

function assertSuperadmin(role?: string | null): void {
  if (role !== "superadmin") {
    throw new Error("Forbidden: superadmin access required.");
  }
}

export type UserRow = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  role: string;
  is_banned: boolean;
  banned_at?: string | null;
  banned_reason?: string | null;
  created_at: string;
};

/**
 * List all users (superadmin only).
 */
export async function listUsersAction(): Promise<{
  data?: UserRow[];
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

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, auth_user_id, full_name, email, role, is_banned, banned_at, banned_reason, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: (data as UserRow[]) || [] };
}

/**
 * Ban a user (superadmin only).
 */
export async function banUserAction(
  userId: string,
  reason: string
): Promise<AdminUserState> {
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

  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: true,
      banned_at: new Date().toISOString(),
      banned_reason: reason || "Banned by superadmin",
    })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: "User banned successfully." };
}

/**
 * Unban a user (superadmin only).
 */
export async function unbanUserAction(userId: string): Promise<AdminUserState> {
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

  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: false,
      banned_at: null,
      banned_reason: null,
    })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: "User unbanned successfully." };
}
