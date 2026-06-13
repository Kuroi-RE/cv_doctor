-- =============================================
-- CV Doctor — Create Storage Bucket + RLS Policies
-- =============================================

-- 1. Create the storage bucket for CV uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-documents',
  'cv-documents',
  false,
  5242880, -- 5 MB in bytes
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if they already exist (idempotent)
DROP POLICY IF EXISTS "Users can upload to cv-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own cv-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own cv-documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all cv-documents" ON storage.objects;

-- 3. Allow authenticated users to upload files to this bucket.
--    Supabase automatically sets storage.objects.owner from the JWT.
CREATE POLICY "Users can upload to cv-documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cv-documents' AND
    auth.uid() = owner
  );

-- 4. Allow users to read (download/view) their own uploaded files
CREATE POLICY "Users can read own cv-documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cv-documents' AND
    auth.uid() = owner
  );

-- 5. Allow users to delete their own files
CREATE POLICY "Users can delete own cv-documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cv-documents' AND
    auth.uid() = owner
  );

-- 6. Allow admins to read any file in the bucket
CREATE POLICY "Admins can read all cv-documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cv-documents' AND
    public.is_admin(auth.uid())
  );
