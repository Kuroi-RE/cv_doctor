"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";

export type AdminKeyState = {
  error?: string;
  success?: string;
};

function assertSuperadmin(role?: string | null): void {
  if (role !== "superadmin") {
    throw new Error("Forbidden: superadmin access required.");
  }
}

/**
 * List all AI provider keys (superadmin only).
 */
export async function listAiProviderKeysAction(): Promise<
  { data?: Array<{ provider: string; api_key: string; model: string; base_url?: string | null; is_active: boolean }>; error?: string }
> {
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
    .from("ai_provider_keys")
    .select("provider, api_key, model, base_url, is_active")
    .order("provider", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: data || [] };
}

/**
 * Upsert an AI provider key (superadmin only).
 */
export async function upsertAiProviderKeyAction(
  _prev: AdminKeyState,
  formData: FormData
): Promise<AdminKeyState> {
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

  const provider = formData.get("provider") as string;
  const apiKey = formData.get("api_key") as string;
  const model = formData.get("model") as string;
  const baseUrl = formData.get("base_url") as string | null;
  const isActive = formData.get("is_active") === "true";

  if (!provider || !apiKey || !model) {
    return { error: "Provider, API key, and model are all required." };
  }

  const { error } = await supabase.from("ai_provider_keys").upsert(
    {
      provider,
      api_key: apiKey,
      model,
      base_url: baseUrl || null,
      is_active: isActive,
    },
    { onConflict: "provider" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/api-keys");
  return { success: `${provider} key saved successfully.` };
}

/**
 * Delete an AI provider key (superadmin only).
 */
export async function deleteAiProviderKeyAction(
  provider: string
): Promise<AdminKeyState> {
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
    .from("ai_provider_keys")
    .delete()
    .eq("provider", provider);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/api-keys");
  return { success: `${provider} key deleted.` };
}
