-- ============================================================================
-- Industry-Normalized Scoring Architecture
-- ============================================================================
-- 1. industry_benchmarks table + seed
-- 2. industry_key on profiles + employer_accounts (if not present)
-- 3. raw + normalized score columns on profiles + employer_accounts
-- Idempotent. Safe defaults. No breaking changes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1 — INDUSTRY BENCHMARKS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.industry_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_key TEXT UNIQUE NOT NULL,
  avg_tenure_months NUMERIC NOT NULL DEFAULT 24,
  avg_reference_response_rate NUMERIC NOT NULL DEFAULT 0.7,
  avg_dispute_rate NUMERIC NOT NULL DEFAULT 0.05,
  avg_rehire_rate NUMERIC NOT NULL DEFAULT 0.6,
  avg_gap_months NUMERIC NOT NULL DEFAULT 3,
  risk_weight NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_key ON public.industry_benchmarks(industry_key);

COMMENT ON TABLE public.industry_benchmarks IS 'Industry baselines for normalized scoring. Used by intelligence engines only.';

-- Seed conservative placeholder averages (safe defaults)
INSERT INTO public.industry_benchmarks (industry_key, avg_tenure_months, avg_reference_response_rate, avg_dispute_rate, avg_rehire_rate, avg_gap_months, risk_weight)
VALUES
  ('security',    18, 0.65, 0.08, 0.55, 4, 1.1),
  ('healthcare',  36, 0.75, 0.04, 0.65, 2, 1.0),
  ('logistics',   15, 0.60, 0.10, 0.50, 5, 1.15),
  ('retail',      12, 0.55, 0.12, 0.45, 6, 1.2),
  ('construction', 20, 0.58, 0.09, 0.52, 4, 1.1),
  ('corporate',   36, 0.80, 0.03, 0.70, 2, 0.95),
  ('hospitality', 14, 0.52, 0.11, 0.48, 5, 1.15),
  ('technology',  30, 0.78, 0.04, 0.68, 2, 1.0)
ON CONFLICT (industry_key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- STEP 2 — INDUSTRY_KEY ON PROFILES + EMPLOYER_ACCOUNTS
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS industry_key TEXT;

ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS industry_key TEXT;

COMMENT ON COLUMN public.profiles.industry_key IS 'Industry for benchmark normalization. Default corporate if null.';
COMMENT ON COLUMN public.employer_accounts.industry_key IS 'Industry for benchmark normalization. Default corporate if null.';

-- ----------------------------------------------------------------------------
-- STEP 4 — RAW + NORMALIZED SCORE COLUMNS (profiles)
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS raw_stability_score NUMERIC;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS normalized_stability_score NUMERIC;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS raw_trust_score NUMERIC;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS normalized_trust_score NUMERIC;

COMMENT ON COLUMN public.profiles.raw_stability_score IS 'Pre-normalization stability. Engine only; not exposed.';
COMMENT ON COLUMN public.profiles.normalized_stability_score IS 'Industry-normalized stability 0–100. Engine only.';
COMMENT ON COLUMN public.profiles.raw_trust_score IS 'Pre-normalization trust. Engine only; not exposed.';
COMMENT ON COLUMN public.profiles.normalized_trust_score IS 'Industry-normalized trust 0–100. Engine only.';

-- ----------------------------------------------------------------------------
-- STEP 4 — RAW + NORMALIZED (employer_accounts)
-- ----------------------------------------------------------------------------
ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS raw_workforce_risk NUMERIC;

ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS normalized_workforce_risk NUMERIC;

COMMENT ON COLUMN public.employer_accounts.raw_workforce_risk IS 'Pre-normalization workforce risk. Engine only.';
COMMENT ON COLUMN public.employer_accounts.normalized_workforce_risk IS 'Industry-normalized workforce risk 0–100. Engine only.';
