"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import {
  Key,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listAiProviderKeysAction,
  upsertAiProviderKeyAction,
  deleteAiProviderKeyAction,
  type AdminKeyState,
} from "@/lib/actions/admin-keys";

const PROVIDER_DEFAULTS: Record<string, { model: string; baseUrl?: string }> = {
  openai: { model: "gpt-4o-mini", baseUrl: "" },
  gemini: { model: "gemini-2.0-flash", baseUrl: "" },
  nvidia: {
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    baseUrl: "https://integrate.api.nvidia.com/v1",
  },
};

type KeyRow = {
  provider: string;
  api_key: string;
  model: string;
  base_url?: string | null;
  is_active: boolean;
};

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Set<string>>(new Set());

  // For new keys
  const [newProvider, setNewProvider] = useState<string>("openai");
  const [newApiKey, setNewApiKey] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newBaseUrl, setNewBaseUrl] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);

  const [state, formAction, isPending] = useActionState<AdminKeyState, FormData>(
    upsertAiProviderKeyAction,
    {}
  );

  const loadKeys = useCallback(async () => {
    setLoading(true);
    const result = await listAiProviderKeysAction();
    if (result.error) {
      setError(result.error);
    } else {
      setKeys(result.data || []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  useEffect(() => {
    if (state.success) {
      loadKeys();
      setEditing(null);
      setNewApiKey("");
      setNewModel(PROVIDER_DEFAULTS[newProvider].model);
      setNewBaseUrl(PROVIDER_DEFAULTS[newProvider].baseUrl || "");
    }
  }, [state.success, loadKeys, newProvider]);

  const handleDelete = async (provider: string) => {
    if (!confirm(`Delete ${provider} key? This action cannot be undone.`))
      return;
    const result = await deleteAiProviderKeyAction(provider);
    if (result.error) {
      setError(result.error);
    } else {
      loadKeys();
    }
  };

  const toggleShowKey = (provider: string) => {
    setShowKey((prev) => {
      const next = new Set(prev);
      if (next.has(provider)) next.delete(provider);
      else next.add(provider);
      return next;
    });
  };

  const maskKey = (key: string) => {
    if (key.length <= 12) return "****";
    return key.slice(0, 6) + "..." + key.slice(-4);
  };

  const existingProviders = new Set(keys.map((k) => k.provider));

  const allProviders = ["openai", "gemini", "nvidia"];
  const missingProviders = allProviders.filter((p) => !existingProviders.has(p));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
          AI Provider Keys
        </h1>
        <p className="mt-2 text-base font-medium text-gray-600">
          Manage API keys for OpenAI, Gemini, and NVIDIA. The AI service reads
          these keys from the database first, falling back to environment
          variables.
        </p>
      </div>

      {state?.error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border-4 border-red-500 bg-red-50 px-5 py-4 shadow-[4px_4px_0px_0px_#ef4444]">
          <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-600" />
          <p className="text-sm font-bold text-red-800">{state.error}</p>
        </div>
      )}

      {state?.success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border-4 border-green-500 bg-green-50 px-5 py-4 shadow-[4px_4px_0px_0px_#22c55e]">
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-600" />
          <p className="text-sm font-bold text-green-800">{state.success}</p>
        </div>
      )}

      {error && !state?.error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border-4 border-red-500 bg-red-50 px-5 py-4 shadow-[4px_4px_0px_0px_#ef4444]">
          <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-600" />
          <p className="text-sm font-bold text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" strokeWidth={3} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Existing keys */}
          {keys.map((key) => (
            <div
              key={key.provider}
              className="rounded-xl border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_#000000]"
            >
              {editing === key.provider ? (
                <form
                  action={formAction}
                  className="space-y-4"
                  onSubmit={() => setEditing(null)}
                >
                  <input type="hidden" name="provider" value={key.provider} />
                  <input type="hidden" name="is_active" value={key.is_active ? "true" : "false"} />

                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase tracking-wider text-black">
                      {key.provider}
                    </h3>
                    <span
                      className={`rounded-lg border-2 border-black px-2.5 py-1 text-xs font-black uppercase tracking-wider ${
                        key.is_active
                          ? "bg-green-200 text-green-800"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {key.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-700">
                        API Key
                      </label>
                      <input
                        name="api_key"
                        defaultValue={key.api_key}
                        required
                        className="w-full rounded-lg border-3 border-black bg-yellow-50 px-3 py-2 text-sm font-bold text-black shadow-[2px_2px_0px_0px_#000000] outline-none focus:bg-yellow-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-700">
                        Model
                      </label>
                      <input
                        name="model"
                        defaultValue={key.model}
                        required
                        className="w-full rounded-lg border-3 border-black bg-yellow-50 px-3 py-2 text-sm font-bold text-black shadow-[2px_2px_0px_0px_#000000] outline-none focus:bg-yellow-100"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-700">
                        Base URL (optional)
                      </label>
                      <input
                        name="base_url"
                        defaultValue={key.base_url || ""}
                        className="w-full rounded-lg border-3 border-black bg-yellow-50 px-3 py-2 text-sm font-bold text-black shadow-[2px_2px_0px_0px_#000000] outline-none focus:bg-yellow-100"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-12 rounded-lg border-4 border-black bg-yellow-300 px-6 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-yellow-400 hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditing(null)}
                      className="h-12 rounded-lg border-4 border-black bg-white px-6 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border-3 border-black bg-yellow-300 shadow-[2px_2px_0px_0px_#000000]">
                        <Key className="h-5 w-5" strokeWidth={3} />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-wider text-black">
                        {key.provider}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-lg border-2 border-black px-2.5 py-1 text-xs font-black uppercase tracking-wider ${
                          key.is_active
                            ? "bg-green-200 text-green-800"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {key.is_active ? "Active" : "Inactive"}
                      </span>
                      <button
                        onClick={() => toggleShowKey(key.provider)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-gray-100 shadow-[1px_1px_0px_0px_#000000]"
                      >
                        {showKey.has(key.provider) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-500">Key:</span>
                      <span className="font-mono font-bold text-black">
                        {showKey.has(key.provider)
                          ? key.api_key
                          : maskKey(key.api_key)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-500">Model:</span>
                      <span className="font-bold text-black">{key.model}</span>
                    </div>
                    {key.base_url && (
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-500">URL:</span>
                        <span className="font-bold text-black">
                          {key.base_url}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => setEditing(key.provider)}
                      className="h-10 rounded-lg border-4 border-black bg-yellow-300 px-4 text-xs font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-yellow-400 hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(key.provider)}
                      className="h-10 rounded-lg border-4 border-black bg-red-100 px-4 text-xs font-black uppercase tracking-wider text-red-700 shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-red-200 hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add new key */}
          {missingProviders.length > 0 && (
            <div className="rounded-xl border-4 border-black bg-cyan-50 p-6 shadow-[6px_6px_0px_0px_#000000]">
              <h3 className="mb-4 text-xl font-black uppercase tracking-wider text-black">
                Add New Provider Key
              </h3>

              <form action={formAction} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-700">
                      Provider
                    </label>
                    <select
                      name="provider"
                      value={newProvider}
                      onChange={(e) => {
                        setNewProvider(e.target.value);
                        setNewModel(PROVIDER_DEFAULTS[e.target.value].model);
                        setNewBaseUrl(
                          PROVIDER_DEFAULTS[e.target.value].baseUrl || ""
                        );
                      }}
                      className="w-full rounded-lg border-3 border-black bg-white px-3 py-2 text-sm font-bold text-black shadow-[2px_2px_0px_0px_#000000] outline-none"
                    >
                      {missingProviders.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-700">
                      API Key
                    </label>
                    <input
                      name="api_key"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      required
                      className="w-full rounded-lg border-3 border-black bg-white px-3 py-2 text-sm font-bold text-black shadow-[2px_2px_0px_0px_#000000] outline-none focus:bg-yellow-50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-700">
                      Model
                    </label>
                    <input
                      name="model"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      required
                      className="w-full rounded-lg border-3 border-black bg-white px-3 py-2 text-sm font-bold text-black shadow-[2px_2px_0px_0px_#000000] outline-none focus:bg-yellow-50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-700">
                      Base URL (optional)
                    </label>
                    <input
                      name="base_url"
                      value={newBaseUrl}
                      onChange={(e) => setNewBaseUrl(e.target.value)}
                      className="w-full rounded-lg border-3 border-black bg-white px-3 py-2 text-sm font-bold text-black shadow-[2px_2px_0px_0px_#000000] outline-none focus:bg-yellow-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={newIsActive}
                    onChange={(e) => setNewIsActive(e.target.checked)}
                    value="true"
                    className="h-5 w-5 rounded border-3 border-black accent-yellow-400"
                  />
                  <label className="text-sm font-bold text-black">
                    Active
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-12 rounded-lg border-4 border-black bg-yellow-300 px-6 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-yellow-400 hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-1 h-4 w-4" />
                  )}
                  Add Key
                </Button>
              </form>
            </div>
          )}

          {keys.length === 0 && missingProviders.length === 0 && (
            <p className="text-center text-sm font-bold text-gray-500">
              No keys configured. Add one above.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
