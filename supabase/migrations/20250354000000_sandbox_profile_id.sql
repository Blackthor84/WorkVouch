-- Sandbox employees and employers backed by real profiles for impersonation.
-- Impersonation API only accepts profile UUIDs; sandbox users get a profile row with sandbox_id set.

ALTER TABLE public.sandbox_employees
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.sandbox_employers
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sandbox_employees_profile_id ON public.sandbox_employees(profile_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_employers_profile_id ON public.sandbox_employers(profile_id);
