-- ============================================================================
-- SUPABASE STORAGE: resumes bucket (private, 5MB, PDF/DOCX, signed URLs only)
-- Access only via API using service role. No direct client access.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  5242880,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- No storage.objects policies: only service role (API) can read/write.
-- This keeps resume files private and avoids exposing them to the client.
