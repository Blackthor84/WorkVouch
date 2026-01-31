-- Add new columns to existing guard_licenses (if table already exists from older migration).
-- Run after security_agency_licenses_compliance.sql if you had guard_licenses with profile_id only.

ALTER TABLE public.guard_licenses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.guard_licenses ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.guard_licenses ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.guard_licenses ADD COLUMN IF NOT EXISTS issue_date DATE;
ALTER TABLE public.guard_licenses ADD COLUMN IF NOT EXISTS uploaded_document_url TEXT;
