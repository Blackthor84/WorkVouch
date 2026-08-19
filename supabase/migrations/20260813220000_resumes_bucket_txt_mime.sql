-- Resume bucket: allow TXT uploads (text/plain) — Sprint 11.2 F-01
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain'
]
WHERE id = 'resumes';
