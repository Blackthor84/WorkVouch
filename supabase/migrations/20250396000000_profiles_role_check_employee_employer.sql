-- Fix role constraint: allow only values the app sends from choose-role (employee, employer)
-- plus NULL (not yet chosen) and admin/superadmin for existing backend roles.
-- Use exact lowercase: 'employee', 'employer'.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role IN ('employee', 'employer', 'admin', 'superadmin'));

COMMENT ON COLUMN public.profiles.role IS 'User role from choose-role: exactly "employee" or "employer". NULL until chosen. admin/superadmin for backend only.';
