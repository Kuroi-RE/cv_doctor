-- =============================================
-- CV Doctor — Database Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CVs table
CREATE TABLE IF NOT EXISTS cvs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  original_file_name TEXT NOT NULL,
  stored_file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'parsing', 'analyzing', 'completed', 'failed')),
  parsed_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Analysis results table
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE NOT NULL UNIQUE,
  overall_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  aspect_scores JSONB NOT NULL DEFAULT '{}',
  highlights TEXT[] NOT NULL DEFAULT '{}',
  issues TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Recommendation items table
CREATE TABLE IF NOT EXISTS recommendation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_result_id UUID REFERENCES analysis_results(id) ON DELETE CASCADE NOT NULL,
  section_name TEXT NOT NULL,
  issue TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Analysis logs table
CREATE TABLE IF NOT EXISTS analysis_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Scoring rules table (optional for MVP)
CREATE TABLE IF NOT EXISTS scoring_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  aspect TEXT NOT NULL,
  weight NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- Auto-create profile on user signup (trigger)
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Updated_at trigger helper
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON cvs;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON cvs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON scoring_rules;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON scoring_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Profiles: users can read/update their own profile; admins can read all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- CVs: owners can CRUD their own; admins can read all
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CVs"
  ON cvs FOR SELECT
  USING (
    user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can insert own CVs"
  ON cvs FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update own CVs"
  ON cvs FOR UPDATE
  USING (
    user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete own CVs"
  ON cvs FOR DELETE
  USING (
    user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Admins can view all CVs"
  ON cvs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Analysis results: accessible through CV ownership
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analysis results"
  ON analysis_results FOR SELECT
  USING (
    cv_id IN (
      SELECT id FROM cvs
      WHERE user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "System can insert analysis results"
  ON analysis_results FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all analysis results"
  ON analysis_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Recommendation items: accessible through analysis_results → CV ownership
ALTER TABLE recommendation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON recommendation_items FOR SELECT
  USING (
    analysis_result_id IN (
      SELECT ar.id FROM analysis_results ar
      JOIN cvs c ON ar.cv_id = c.id
      WHERE c.user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "System can insert recommendations"
  ON recommendation_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all recommendations"
  ON recommendation_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Analysis logs: owner or admin
ALTER TABLE analysis_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON analysis_logs FOR SELECT
  USING (
    user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "System can insert logs"
  ON analysis_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all logs"
  ON analysis_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin logs: admin only
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin logs"
  ON admin_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert admin logs"
  ON admin_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Scoring rules: read for authenticated users, write for admins
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view scoring rules"
  ON scoring_rules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage scoring rules"
  ON scoring_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_status ON cvs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_results_cv_id ON analysis_results(cv_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_items_analysis_result_id ON recommendation_items(analysis_result_id);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_user_id ON analysis_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_cv_id ON analysis_logs(cv_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
