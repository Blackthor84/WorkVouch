-- log_admin_action: SECURITY DEFINER helper for SQL/triggers to record admin actions.
-- Table admin_audit_log (singular) as specified for this function.

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_log_admin_user_id on public.admin_audit_log(admin_user_id);
create index if not exists idx_admin_audit_log_created_at on public.admin_audit_log(created_at desc);

revoke update on public.admin_audit_log from public;
revoke delete on public.admin_audit_log from public;

create or replace function public.log_admin_action(
  action text,
  target_type text,
  target_id uuid,
  metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.admin_audit_log
  (admin_user_id, action, target_type, target_id, metadata)
  values (auth.uid(), action, target_type, target_id, metadata);
$$;

comment on function public.log_admin_action(text, text, uuid, jsonb) is
  'Record an admin action from SQL/triggers. Inserts into admin_audit_log.';
