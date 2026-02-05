-- ============================================================================
-- SANDBOX V2 — Fully isolated enterprise simulation layer
-- All tables prefixed sandbox_. No production tables. ON DELETE CASCADE.
-- ============================================================================

-- 1. Core Sandbox Session
CREATE TABLE IF NOT EXISTS public.sandbox_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_by UUID,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_ends_at ON public.sandbox_sessions(ends_at);
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_status ON public.sandbox_sessions(status);

-- 2. Sandbox Employers
CREATE TABLE IF NOT EXISTS public.sandbox_employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  company_name TEXT,
  industry TEXT,
  plan_tier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_employers_sandbox_id ON public.sandbox_employers(sandbox_id);

-- 3. Sandbox Employees
CREATE TABLE IF NOT EXISTS public.sandbox_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  full_name TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_employees_sandbox_id ON public.sandbox_employees(sandbox_id);

-- 4. Sandbox Employment Records
CREATE TABLE IF NOT EXISTS public.sandbox_employment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.sandbox_employees(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES public.sandbox_employers(id) ON DELETE CASCADE,
  role TEXT,
  tenure_months INT,
  rehire_eligible BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_employment_records_sandbox_id ON public.sandbox_employment_records(sandbox_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_employment_records_employee_id ON public.sandbox_employment_records(employee_id);

-- 5. Sandbox Peer Reviews
CREATE TABLE IF NOT EXISTS public.sandbox_peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.sandbox_employees(id) ON DELETE SET NULL,
  reviewed_id UUID REFERENCES public.sandbox_employees(id) ON DELETE SET NULL,
  rating INT,
  review_text TEXT,
  sentiment_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_peer_reviews_sandbox_id ON public.sandbox_peer_reviews(sandbox_id);

-- 6. Sandbox Intelligence Outputs
CREATE TABLE IF NOT EXISTS public.sandbox_intelligence_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.sandbox_employees(id) ON DELETE SET NULL,
  profile_strength NUMERIC,
  career_health NUMERIC,
  risk_index NUMERIC,
  team_fit NUMERIC,
  hiring_confidence NUMERIC,
  network_density NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS sandbox_intelligence_outputs_sandbox_employee_key ON public.sandbox_intelligence_outputs(sandbox_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_intelligence_outputs_sandbox_id ON public.sandbox_intelligence_outputs(sandbox_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_intelligence_outputs_employee_id ON public.sandbox_intelligence_outputs(employee_id);

-- 7. Sandbox Revenue + Ads
CREATE TABLE IF NOT EXISTS public.sandbox_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  mrr NUMERIC,
  churn_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_revenue_sandbox_id ON public.sandbox_revenue(sandbox_id);

CREATE TABLE IF NOT EXISTS public.sandbox_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.sandbox_employers(id) ON DELETE SET NULL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  spend NUMERIC DEFAULT 0,
  roi NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_ads_sandbox_id ON public.sandbox_ads(sandbox_id);

-- 8. Feature Registry (future-proof: sync from production feature_flags)
CREATE TABLE IF NOT EXISTS public.sandbox_feature_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Feature overrides per sandbox session
CREATE TABLE IF NOT EXISTS public.sandbox_feature_overrides (
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  PRIMARY KEY (sandbox_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_sandbox_feature_overrides_sandbox_id ON public.sandbox_feature_overrides(sandbox_id);

COMMENT ON TABLE public.sandbox_sessions IS 'V2 enterprise sandbox sessions. Fully isolated from production.';
COMMENT ON TABLE public.sandbox_employers IS 'Sandbox-only employers.';
COMMENT ON TABLE public.sandbox_employees IS 'Sandbox-only employees.';
COMMENT ON TABLE public.sandbox_employment_records IS 'Sandbox employment links.';
COMMENT ON TABLE public.sandbox_peer_reviews IS 'Sandbox peer reviews for intelligence.';
COMMENT ON TABLE public.sandbox_intelligence_outputs IS 'Sandbox intelligence engine outputs only.';
COMMENT ON TABLE public.sandbox_feature_registry IS 'Synced from production feature_flags; used for sandbox toggles.';
