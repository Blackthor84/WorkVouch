-- ============================================================================
-- SUPABASE STORAGE: dispute evidence (private bucket, signed URLs only)
-- Run in Supabase SQL Editor. Bucket creation may require Dashboard for first run.
-- ============================================================================

-- Create private bucket for dispute evidence (if storage.buckets exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dispute-evidence',
  'dispute-evidence',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- Policy: authenticated users can upload to their own folder (user_id prefix)
DROP POLICY IF EXISTS "dispute_evidence_upload" ON storage.objects;
CREATE POLICY "dispute_evidence_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dispute-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: users can read their own uploads
DROP POLICY IF EXISTS "dispute_evidence_select_own" ON storage.objects;
CREATE POLICY "dispute_evidence_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'dispute-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: admins can read all in bucket
DROP POLICY IF EXISTS "dispute_evidence_admin_select" ON storage.objects;
CREATE POLICY "dispute_evidence_admin_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'dispute-evidence'
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
