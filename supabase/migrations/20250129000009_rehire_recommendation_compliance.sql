-- ============================================================================
-- REHIRE RECOMMENDATION COMPLIANCE
-- recommendation, reason_category, detailed_explanation (min 150 when not Approved),
-- confirmed_accuracy, submitted_at; version history for immutability.
-- ============================================================================

-- rehire_registry: add compliance fields (recommendation = rehire_status, reason_category = reason already exist from 20250129000008)
ALTER TABLE public.rehire_registry
  ADD COLUMN IF NOT EXISTS detailed_explanation TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_accuracy BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.rehire_registry.detailed_explanation IS 'Required when recommendation is not Approved; min 150 characters.';
COMMENT ON COLUMN public.rehire_registry.confirmed_accuracy IS 'Employer must confirm accuracy before submission.';
COMMENT ON COLUMN public.rehire_registry.submitted_at IS 'Set on first submission; used for immutability and dispute linking.';

-- Version history: when employer updates after submission, we copy current row here before overwriting
CREATE TABLE IF NOT EXISTS public.rehire_evaluation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rehire_registry_id UUID NOT NULL REFERENCES public.rehire_registry(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rehire_status rehire_status_enum,
  reason rehire_reason_enum,
  detailed_explanation TEXT,
  confirmed_accuracy BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rehire_eval_versions_registry ON public.rehire_evaluation_versions(rehire_registry_id);
CREATE INDEX IF NOT EXISTS idx_rehire_eval_versions_profile ON public.rehire_evaluation_versions(profile_id);

COMMENT ON TABLE public.rehire_evaluation_versions IS 'Immutable version history when employer updates a submitted evaluation.';

ALTER TABLE public.rehire_evaluation_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers can view own rehire_evaluation_versions" ON public.rehire_evaluation_versions;
CREATE POLICY "Employers can view own rehire_evaluation_versions"
  ON public.rehire_evaluation_versions FOR SELECT
  USING (
    employer_id IN (SELECT id FROM public.employer_accounts WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- compliance_disputes: link to evaluation for dispute context
ALTER TABLE public.compliance_disputes
  ADD COLUMN IF NOT EXISTS evaluation_id UUID REFERENCES public.rehire_registry(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_disputes_evaluation_id ON public.compliance_disputes(evaluation_id);
COMMENT ON COLUMN public.compliance_disputes.evaluation_id IS 'Rehire evaluation (rehire_registry.id) when dispute_type is RehireStatus.';
