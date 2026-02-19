-- View for admin audit log UI: flat shape with action, scenario_id, metadata.
create or replace view public.admin_audit_log_view as
select
  id,
  created_at,
  admin_email,
  action_type as action,
  (after_state->>'scenario_id')::uuid as scenario_id,
  coalesce(after_state, before_state, '{}'::jsonb) as metadata
from public.admin_audit_logs;

comment on view public.admin_audit_log_view is 'Read-only view for admin audit log UI. action_type as action, scenario_id from metadata when present.';
