-- ============================================================================
-- Soft restriction: hide profile from employer search (admin toggle only).
-- Restricted profiles remain visible to admins. No hard-delete.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS restricted_from_employer_search BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.restricted_from_employer_search IS 'When true, profile is excluded from employer candidate search; admins can still view.';

-- Refresh employer_candidate_view to expose the flag so API can filter (employers get only non-restricted).
CREATE OR REPLACE VIEW public.employer_candidate_view AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.industry,
  p.city,
  p.state,
  COALESCE(p.restricted_from_employer_search, false) AS restricted_from_employer_search,
  (SELECT COUNT(*) FROM public.employment_records er WHERE er.user_id = p.id AND er.verification_status = 'verified') AS verified_employment_count,
  COALESCE(ts.score, 0) AS trust_score,
  COALESCE(ts.reference_count, 0)::INTEGER AS reference_count,
  COALESCE(ts.average_rating, 0) AS aggregate_rating,
  (SELECT COUNT(*) FROM public.employment_records er WHERE er.user_id = p.id AND er.rehire_eligible = true) AS rehire_eligible_count
FROM public.profiles p
LEFT JOIN public.trust_scores ts ON ts.user_id = p.id;

COMMENT ON VIEW public.employer_candidate_view IS 'Employer-facing candidate summary. Tier access enforced in API. Exclude restricted_from_employer_search = true in employer search.';
