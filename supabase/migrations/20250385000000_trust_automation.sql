-- ============================================================================
-- Trust Automation: rules and alerts for event-driven trust intelligence
-- ============================================================================

-- 1) trust_automation_rules
CREATE TABLE IF NOT EXISTS public.trust_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  rule_conditions JSONB NOT NULL DEFAULT '{}',
  notification_type TEXT NOT NULL DEFAULT 'create_dashboard_alert',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trust_automation_rules_employer ON public.trust_automation_rules(employer_id);
CREATE INDEX IF NOT EXISTS idx_trust_automation_rules_type ON public.trust_automation_rules(rule_type);

COMMENT ON TABLE public.trust_automation_rules IS 'Employer-defined automation: candidate_meets_policy, candidate_trust_risk, employee_trust_risk, verification_expiring, credential_shared. Event-driven evaluation.';
COMMENT ON COLUMN public.trust_automation_rules.rule_conditions IS 'JSON: policy_id, min_trust_score, verification_coverage, no_recent_disputes, etc.';
COMMENT ON COLUMN public.trust_automation_rules.notification_type IS 'send_notification | create_dashboard_alert | log_trust_event';

ALTER TABLE public.trust_automation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers can view own automation rules" ON public.trust_automation_rules;
CREATE POLICY "Employers can view own automation rules"
  ON public.trust_automation_rules FOR SELECT USING (employer_id = auth.uid());
DROP POLICY IF EXISTS "Employers can insert own automation rules" ON public.trust_automation_rules;
CREATE POLICY "Employers can insert own automation rules"
  ON public.trust_automation_rules FOR INSERT WITH CHECK (employer_id = auth.uid());
DROP POLICY IF EXISTS "Employers can update own automation rules" ON public.trust_automation_rules;
CREATE POLICY "Employers can update own automation rules"
  ON public.trust_automation_rules FOR UPDATE USING (employer_id = auth.uid()) WITH CHECK (employer_id = auth.uid());
DROP POLICY IF EXISTS "Employers can delete own automation rules" ON public.trust_automation_rules;
CREATE POLICY "Employers can delete own automation rules"
  ON public.trust_automation_rules FOR DELETE USING (employer_id = auth.uid());

-- 2) trust_alerts
CREATE TABLE IF NOT EXISTS public.trust_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  alert_message TEXT NOT NULL,
  rule_id UUID REFERENCES public.trust_automation_rules(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trust_alerts_employer ON public.trust_alerts(employer_id);
CREATE INDEX IF NOT EXISTS idx_trust_alerts_candidate ON public.trust_alerts(candidate_id);
CREATE INDEX IF NOT EXISTS idx_trust_alerts_created ON public.trust_alerts(created_at DESC);

COMMENT ON TABLE public.trust_alerts IS 'Dashboard alerts created by trust automation rules.';

ALTER TABLE public.trust_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers can view own trust alerts" ON public.trust_alerts;
CREATE POLICY "Employers can view own trust alerts"
  ON public.trust_alerts FOR SELECT USING (employer_id = auth.uid());
