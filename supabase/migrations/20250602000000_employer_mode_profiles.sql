-- Employer mode: ensure profiles.role and add is_premium for paywall
-- role already added in earlier migrations (profiles_role_employee_employer, etc.)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_premium IS 'Employer monetization: true = can view full candidate work history and profiles.';
