-- =============================================
-- CV Doctor — Add superadmin role + user banning
-- =============================================

-- 1. Drop the old role CHECK constraint and recreate with 'superadmin'
--    Also update existing 'admin' rows to 'superadmin'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

UPDATE profiles
  SET role = 'superadmin'
  WHERE role = 'admin';

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'superadmin'));

-- 2. Add ban fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT;

-- 3. Update is_admin() helper to check 'superadmin'
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = user_id AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update all admin-facing RLS policies to use 'superadmin' instead of 'admin'
--    Profiles: admins can view all → superadmins can view all
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Superadmins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin(auth.uid()));

-- CVs: admins can view all → superadmins can view all
DROP POLICY IF EXISTS "Admins can view all CVs" ON cvs;
CREATE POLICY "Superadmins can view all CVs"
  ON cvs FOR SELECT
  USING (is_admin(auth.uid()));

-- Analysis results: admins can view all → superadmins can view all
DROP POLICY IF EXISTS "Admins can view all analysis results" ON analysis_results;
CREATE POLICY "Superadmins can view all analysis results"
  ON analysis_results FOR SELECT
  USING (is_admin(auth.uid()));

-- Recommendation items: admins can view all → superadmins can view all
DROP POLICY IF EXISTS "Admins can view all recommendations" ON recommendation_items;
CREATE POLICY "Superadmins can view all recommendations"
  ON recommendation_items FOR SELECT
  USING (is_admin(auth.uid()));

-- Analysis logs: admins can view all → superadmins can view all
DROP POLICY IF EXISTS "Admins can view all logs" ON analysis_logs;
CREATE POLICY "Superadmins can view all logs"
  ON analysis_logs FOR SELECT
  USING (is_admin(auth.uid()));

-- Admin logs: admins can view admin logs → superadmins can view admin logs
DROP POLICY IF EXISTS "Admins can view admin logs" ON admin_logs;
CREATE POLICY "Superadmins can view admin logs"
  ON admin_logs FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert admin logs" ON admin_logs;
CREATE POLICY "Superadmins can insert admin logs"
  ON admin_logs FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Scoring rules: admins can manage → superadmins can manage
DROP POLICY IF EXISTS "Admins can manage scoring rules" ON scoring_rules;
CREATE POLICY "Superadmins can manage scoring rules"
  ON scoring_rules FOR ALL
  USING (is_admin(auth.uid()));

-- 5. Add index for ban lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);
