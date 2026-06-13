-- Add INSERT policy for profiles so auto-create works from server actions
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);
