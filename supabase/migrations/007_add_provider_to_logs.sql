-- =============================================
-- CV Doctor — Add provider column to analysis_logs
-- =============================================

ALTER TABLE analysis_logs
  ADD COLUMN IF NOT EXISTS provider TEXT;

-- Index for quick filtering by provider
CREATE INDEX IF NOT EXISTS idx_analysis_logs_provider
  ON analysis_logs(provider);
