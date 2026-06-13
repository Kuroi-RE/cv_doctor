import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type AnySupabaseClient = SupabaseClient<any, any, any>;

/**
 * Get the authenticated user from the current session.
 * Uses getSession() instead of getUser() because it reads directly
 * from cookies, which is more reliable in Server Actions.
 */
export async function getAuthUser(client?: AnySupabaseClient) {
  const supabase = client ?? (await createClient());
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    console.error("getAuthUser: no session", error?.message);
    return null;
  }

  return session.user;
}

/**
 * Get the current user's profile. If it doesn't exist, auto-create it.
 * Returns { profile, error } so callers can show meaningful messages.
 */
export async function getOrCreateProfile(client?: AnySupabaseClient): Promise<{
  profile: Record<string, any> | null;
  error?: string;
}> {
  const supabase = client ?? (await createClient());
  const user = await getAuthUser(supabase);

  if (!user) {
    return { profile: null, error: "Not authenticated (no session found)." };
  }

  let { data: profile, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (selectError) {
    console.error("Profile SELECT error:", selectError.message, selectError.code);
  }

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
      console.error("Profile INSERT error:", insertError?.message, insertError?.code);
      return {
        profile: null,
        error: `Profile creation failed: ${insertError?.message || "unknown"}`,
      };
    }

    profile = newProfile;
  }

  return { profile };
}
