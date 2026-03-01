-- ============================================================================
-- content_flags: moderation queue for references and reviews. Admin-only.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('reference', 'review')),
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'removed', 'escalated')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_action TEXT CHECK (resolution_action IS NULL OR resolution_action IN ('approve', 'remove', 'escalate')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_flags_status ON public.content_flags(status);
CREATE INDEX IF NOT EXISTS idx_content_flags_content ON public.content_flags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_created ON public.content_flags(created_at DESC);

ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

-- No direct user access; admin APIs use service role.
DROP POLICY IF EXISTS "Service role only content_flags" ON public.content_flags;
CREATE POLICY "Service role only content_flags"
  ON public.content_flags FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.content_flags IS 'Flagged content moderation queue. Admin create/list/resolve via API (service role).';
