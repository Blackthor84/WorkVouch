-- Add verified employment coverage percentage to employer_candidate_view.
-- Percentage = verified employment records / total employment records, rounded; 0 when no records.

CREATE OR REPLACE VIEW public.employer_candidate_view AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.industry,
  p.city,
  p.state,
  COALESCE(p.restricted_from_employer_search, false) AS restricted_from_employer_search,
  (SELECT COUNT(*) FROM public.employment_records er WHERE er.user_id = p.id AND er.verification_status = 'verified') AS verified_employment_count,
  (SELECT COUNT(*) FROM public.employment_records et WHERE et.user_id = p.id) AS total_employment_count,
  (SELECT COALESCE(ROUND(SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0) * 100, 0)::integer, 0) FROM public.employment_records WHERE user_id = p.id) AS verified_employment_coverage_pct,
  COALESCE(ts.score, 0) AS trust_score,
  COALESCE(ts.reference_count, 0)::INTEGER AS reference_count,
  COALESCE(ts.average_rating, 0) AS aggregate_rating,
  (SELECT COUNT(*) FROM public.employment_records er2 WHERE er2.user_id = p.id AND er2.rehire_eligible = true) AS rehire_eligible_count
FROM public.profiles p
LEFT JOIN public.trust_scores ts ON ts.user_id = p.id;

COMMENT ON VIEW public.employer_candidate_view IS 'Employer-facing candidate summary. verified_employment_coverage_pct = rounded % of verified vs total employment records.';
