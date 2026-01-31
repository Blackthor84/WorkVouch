-- Workforce Intelligence: verification_reports columns for department, role, industry, dispute flag.
-- Run after verification_reports and risk_score exist. Idempotent.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_reports') THEN
    ALTER TABLE public.verification_reports ADD COLUMN IF NOT EXISTS department TEXT;
    ALTER TABLE public.verification_reports ADD COLUMN IF NOT EXISTS job_role TEXT;
    ALTER TABLE public.verification_reports ADD COLUMN IF NOT EXISTS industry TEXT;
    ALTER TABLE public.verification_reports ADD COLUMN IF NOT EXISTS dispute_flag BOOLEAN NOT NULL DEFAULT false;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
