-- Employer monetization: profiles.plan (free | pro | enterprise)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employer_simulation_uses INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'pro', 'enterprise'));

COMMENT ON COLUMN public.profiles.plan IS 'Employer billing tier: free (preview), pro, enterprise. Employees default free (unused).';
COMMENT ON COLUMN public.profiles.employer_simulation_uses IS 'Free-tier employer simulation runs (lifetime counter; reset via admin or billing).';
