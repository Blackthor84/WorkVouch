-- ============================================================================
-- EMPLOYER SUBMISSION STRUCTURE
-- Rehire status, mandatory reason, justification required for EligibleWithReview/NotEligible
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE rehire_status_enum AS ENUM (
    'Approved',
    'EligibleWithReview',
    'NotEligible'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehire_reason_enum AS ENUM (
    'AttendanceIssues',
    'PolicyViolation',
    'PerformanceConcerns',
    'ContractCompletion',
    'RoleEliminated',
    'Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add columns to rehire_logs (audit trail for employer submissions)
ALTER TABLE public.rehire_logs
  ADD COLUMN IF NOT EXISTS rehire_status rehire_status_enum,
  ADD COLUMN IF NOT EXISTS reason rehire_reason_enum,
  ADD COLUMN IF NOT EXISTS justification TEXT;

-- rehire_registry: add structured fields (employer-facing submission)
-- If rehire_registry exists with employer_id, profile_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rehire_registry') THEN
    ALTER TABLE public.rehire_registry
      ADD COLUMN IF NOT EXISTS rehire_status rehire_status_enum,
      ADD COLUMN IF NOT EXISTS reason rehire_reason_enum,
      ADD COLUMN IF NOT EXISTS justification TEXT;
  END IF;
END $$;

COMMENT ON COLUMN public.rehire_logs.rehire_status IS 'Approved | EligibleWithReview | NotEligible; required for employer submission.';
COMMENT ON COLUMN public.rehire_logs.reason IS 'Mandatory structured reason: AttendanceIssues, PolicyViolation, PerformanceConcerns, ContractCompletion, RoleEliminated, Other.';
COMMENT ON COLUMN public.rehire_logs.justification IS 'Required written justification when rehire_status is EligibleWithReview or NotEligible; required when reason is Other.';
