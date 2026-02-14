-- Organizations demo flag: demo orgs only visible in sandbox; production never sees them.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS demo BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.organizations.demo IS 'When true, org is for demo/sandbox only. Production queries must exclude demo=true.';
