-- =============================================
-- CV Doctor — AI Provider API Keys table
-- =============================================

CREATE TABLE IF NOT EXISTS ai_provider_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'nvidia')),
  api_key TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique provider constraint (one row per provider)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_provider_keys_provider
  ON ai_provider_keys(provider);

-- Enable RLS
ALTER TABLE ai_provider_keys ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read/write API keys
CREATE POLICY "Superadmins can view API keys"
  ON ai_provider_keys FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Superadmins can insert API keys"
  ON ai_provider_keys FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Superadmins can update API keys"
  ON ai_provider_keys FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Superadmins can delete API keys"
  ON ai_provider_keys FOR DELETE
  USING (is_admin(auth.uid()));

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON ai_provider_keys;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON ai_provider_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
