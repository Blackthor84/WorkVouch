-- ============================================================================
-- HEAT MAP PRIVACY: Do not persist city-level data in site_sessions.
-- Analytics/heat map use country + U.S. state only. SOC2/App Store compliant.
-- ============================================================================

-- Force city to NULL on insert/update so no code path can persist city-level data
CREATE OR REPLACE FUNCTION public.site_sessions_null_city()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.city := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS site_sessions_null_city_trigger ON public.site_sessions;
CREATE TRIGGER site_sessions_null_city_trigger
  BEFORE INSERT OR UPDATE ON public.site_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.site_sessions_null_city();

COMMENT ON FUNCTION public.site_sessions_null_city() IS 'Privacy: heat map uses country/state only. City must never be stored in analytics.';
