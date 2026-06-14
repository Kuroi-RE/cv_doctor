import { createServiceClient } from "@/lib/supabase/service";

export type AiProviderKey = {
  provider: "openai" | "gemini" | "nvidia";
  apiKey: string;
  model: string;
  baseUrl?: string | null;
  isActive: boolean;
};

export type ResolvedAiKeys = Record<
  string,
  { key: string; model: string; baseUrl?: string | null }
>;

/**
 * Fetch active AI provider keys from the database using service-role client.
 * Returns null if no keys are configured in the database.
 */
export async function getDbAiKeys(): Promise<ResolvedAiKeys | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("ai_provider_keys")
    .select("provider, api_key, model, base_url, is_active")
    .eq("is_active", true);

  if (error || !data || data.length === 0) {
    return null;
  }

  const resolved: ResolvedAiKeys = {};

  for (const row of data) {
    if (!row.api_key) continue;
    resolved[row.provider] = {
      key: row.api_key,
      model: row.model || getDefaultModel(row.provider),
      baseUrl: row.base_url || null,
    };
  }

  return Object.keys(resolved).length > 0 ? resolved : null;
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case "openai":
      return "gpt-4o-mini";
    case "gemini":
      return "gemini-2.0-flash";
    case "nvidia":
      return "nvidia/nemotron-3-ultra-550b-a55b";
    default:
      return "";
  }
}

/**
 * Upsert an AI provider key. Idempotent per provider.
 */
export async function upsertAiProviderKey(key: AiProviderKey): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.from("ai_provider_keys").upsert(
    {
      provider: key.provider,
      api_key: key.apiKey,
      model: key.model,
      base_url: key.baseUrl || null,
      is_active: key.isActive,
    },
    { onConflict: "provider" }
  );

  if (error) {
    throw new Error(`Failed to save ${key.provider} key: ${error.message}`);
  }
}

/**
 * Delete an AI provider key by provider name.
 */
export async function deleteAiProviderKey(provider: string): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("ai_provider_keys")
    .delete()
    .eq("provider", provider);

  if (error) {
    throw new Error(`Failed to delete ${provider} key: ${error.message}`);
  }
}

/**
 * Fetch all AI provider keys (active and inactive) for admin display.
 */
export async function listAllAiProviderKeys(): Promise<AiProviderKey[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("ai_provider_keys")
    .select("provider, api_key, model, base_url, is_active")
    .order("provider", { ascending: true });

  if (error) {
    throw new Error(`Failed to list keys: ${error.message}`);
  }

  return (data || []).map((row) => ({
    provider: row.provider,
    apiKey: row.api_key,
    model: row.model,
    baseUrl: row.base_url,
    isActive: row.is_active,
  }));
}
