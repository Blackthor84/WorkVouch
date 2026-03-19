-- Profiles: resume_url and resume_uploaded_at for file upload flow
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_uploaded_at TIMESTAMPTZ;
COMMENT ON COLUMN public.profiles.resume_url IS 'Storage path (e.g. resumes/user-id-timestamp.pdf) for uploaded resume file.';
COMMENT ON COLUMN public.profiles.resume_uploaded_at IS 'When the resume was last uploaded.';

-- Resumes bucket: allow DOC (application/msword) in addition to PDF and DOCX
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
]
WHERE id = 'resumes';
