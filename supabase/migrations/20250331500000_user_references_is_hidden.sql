-- Admin moderation: hide reference from public view without deleting.
ALTER TABLE public.user_references
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_references.is_hidden IS 'When true, hidden by admin moderation; do not show in public lists.';
