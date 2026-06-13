-- =============================================
-- CV Doctor — Fix RLS Infinite Recursion
-- =============================================
--
-- PROBLEM:
-- The "Admins can view all profiles" policy (and all other admin policies)
-- use EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'admin').
-- When PostgreSQL evaluates RLS on the profiles table, this subquery also
-- triggers RLS on profiles, which re-evaluates the same policy → infinite recursion (42P17).
--
-- This cascades to EVERY table whose policy queries profiles (cvs, analysis_results,
-- recommendation_items, analysis_logs, admin_logs, scoring_rules).
--
-- FIX:
-- 1. Create a SECURITY DEFINER function that checks admin status while BYPASSING RLS.
-- 2. Drop all recursive admin policies and recreate them using is_admin(auth.uid()).
-- 3. Also fix the profiles table policies to avoid self-reference.

-- =============================================
-- 1. Helper function: check admin status (bypasses RLS)
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. Fix profiles table policies
-- =============================================
-- Drop the recursive admin policy on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Recreate it using the non-recursive helper
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin(auth.uid()));

-- =============================================
-- 3. Fix CVs table policies
-- =============================================
DROP POLICY IF EXISTS "Admins can view all CVs" ON cvs;

CREATE POLICY "Admins can view all CVs"
  ON cvs FOR SELECT
  USING (is_admin(auth.uid()));

-- =============================================
-- 4. Fix analysis_results table policies
-- =============================================
DROP POLICY IF EXISTS "Admins can view all analysis results" ON analysis_results;

CREATE POLICY "Admins can view all analysis results"
  ON analysis_results FOR SELECT
  USING (is_admin(auth.uid()));

-- =============================================
-- 5. Fix recommendation_items table policies
-- =============================================
DROP POLICY IF EXISTS "Admins can view all recommendations" ON recommendation_items;

CREATE POLICY "Admins can view all recommendations"
  ON recommendation_items FOR SELECT
  USING (is_admin(auth.uid()));

-- =============================================
-- 6. Fix analysis_logs table policies
-- =============================================
DROP POLICY IF EXISTS "Admins can view all logs" ON analysis_logs;

CREATE POLICY "Admins can view all logs"
  ON analysis_logs FOR SELECT
  USING (is_admin(auth.uid()));

-- =============================================
-- 7. Fix admin_logs table policies
-- =============================================
DROP POLICY IF EXISTS "Admins can view admin logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can insert admin logs" ON admin_logs;

CREATE POLICY "Admins can view admin logs"
  ON admin_logs FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert admin logs"
  ON admin_logs FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- =============================================
-- 8. Fix scoring_rules table policies
-- =============================================
DROP POLICY IF EXISTS "Admins can manage scoring rules" ON scoring_rules;

CREATE POLICY "Admins can manage scoring rules"
  ON scoring_rules FOR ALL
  USING (is_admin(auth.uid()));
