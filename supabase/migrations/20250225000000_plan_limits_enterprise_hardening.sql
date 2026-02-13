-- ============================================================================
-- ENTERPRISE HARDENING: Align plan_limits with spec (Starter / Growth caps).
-- Additive: UPDATE existing rows only. No DROP, no data loss.
-- ============================================================================

UPDATE public.plan_limits
SET
  max_locations = 1,
  max_admins = 1,
  max_monthly_checks = 50,
  updated_at = NOW()
WHERE plan_key = 'starter';

UPDATE public.plan_limits
SET
  max_locations = 2,
  max_admins = 3,
  max_monthly_checks = 200,
  updated_at = NOW()
WHERE plan_key IN ('growth', 'professional');

-- enterprise / custom remain -1 (unlimited)
