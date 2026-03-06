-- ============================================================================
-- Coworker discovery: ensure indexes exist for efficient overlap queries.
-- (company_name and company_dates already exist in 20250129000001.)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_employment_records_start_date ON public.employment_records(start_date);
CREATE INDEX IF NOT EXISTS idx_employment_records_end_date ON public.employment_records(end_date) WHERE end_date IS NOT NULL;

COMMENT ON INDEX idx_employment_records_start_date IS 'Supports date-overlap queries for coworker discovery.';
COMMENT ON INDEX idx_employment_records_end_date IS 'Supports date-overlap queries for coworker discovery.';
