-- ============================================================================
-- Founder-only, time-boxed production override. Single active override row.
-- Production mutations allowed only when override is enabled and not expired.
-- ============================================================================

-- Single row table: who is the founder (email). Set via API or manually.
create table if not exists public.admin_founder (
  id int primary key default 1 check (id = 1),
  email text not null
);

comment on table public.admin_founder is 'Single row: founder email. Only this user can enable production admin override.';

-- Ensure one row exists (placeholder; replace with actual founder email).
insert into public.admin_founder (id, email)
values (1, 'founder@example.com')
on conflict (id) do nothing;

revoke update on public.admin_founder from anon, authenticated;
revoke delete on public.admin_founder from anon, authenticated;

-- admin_override: single active override. Only one row should have enabled = true at a time.
create table if not exists public.admin_override (
  id uuid primary key default gen_random_uuid(),
  enabled boolean not null default true,
  enabled_by uuid not null,
  enabled_at timestamptz not null default now(),
  expires_at timestamptz not null,
  reason text not null default ''
);

create index if not exists idx_admin_override_enabled_expires on public.admin_override(enabled, expires_at);
create index if not exists idx_admin_override_enabled_at on public.admin_override(enabled_at desc);

comment on table public.admin_override is 'Time-boxed production override. When enabled and not expired, playground mutations allowed in production.';

revoke all on public.admin_override from anon, authenticated;
grant select on public.admin_override to authenticated;
grant insert, update, delete on public.admin_override to service_role;

-- Returns true only if there is an active override (enabled and not expired).
create or replace function public.is_admin_override_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_override
    where enabled = true and expires_at > now()
  );
$$;

comment on function public.is_admin_override_active() is 'True when a production override is enabled and not expired.';

-- Enable override. Only callable when caller email matches admin_founder. Deletes previous overrides, inserts new one.
-- API passes caller_email and enabled_by (user id) when using service role; RPC verifies email match.
create or replace function public.enable_admin_override(
  duration_minutes int,
  reason text,
  caller_email text,
  enabled_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  founder_email text;
  current_email text;
  new_id uuid;
  admin_id uuid;
begin
  if duration_minutes is null or duration_minutes < 1 or duration_minutes > 1440 then
    raise exception 'duration_minutes must be between 1 and 1440';
  end if;
  reason := coalesce(trim(reason), '');
  if length(reason) < 3 then
    raise exception 'reason must be at least 3 characters';
  end if;

  select email into founder_email from public.admin_founder limit 1;
  if founder_email is null or founder_email = '' then
    raise exception 'Founder email not configured';
  end if;

  current_email := coalesce(trim(caller_email), '');
  if current_email = '' then
    current_email := auth.jwt() ->> 'email';
  end if;
  if current_email is null or lower(current_email) <> lower(founder_email) then
    raise exception 'Only the founder can enable production override'
      using errcode = 'P0001';
  end if;

  admin_id := coalesce(enabled_by, auth.uid());
  if admin_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.admin_override;

  insert into public.admin_override (enabled, enabled_by, enabled_at, expires_at, reason)
  values (
    true,
    admin_id,
    now(),
    now() + (duration_minutes || ' minutes')::interval,
    reason
  )
  returning id into new_id;

  perform public.log_admin_action(
    'admin_override_enabled',
    'system',
    new_id,
    jsonb_build_object(
      'duration_minutes', duration_minutes,
      'reason', reason,
      'expires_at', now() + (duration_minutes || ' minutes')::interval
    )
  );

  return new_id;
end;
$$;

comment on function public.enable_admin_override(int, text, text, uuid) is
  'Founder-only: enable time-boxed production override. Caller email must match admin_founder. enabled_by for service-role calls.';

-- Replace assert_sandbox_environment(): allow production when override is active; otherwise same (raise in production).
create or replace function public.assert_sandbox_environment()
returns void
language plpgsql
stable
as $$
declare
  env text := coalesce(nullif(trim(current_setting('app.environment', true)), ''), 'production');
begin
  if env <> 'production' then
    return;
  end if;
  if not public.is_admin_override_active() then
    raise exception 'Mutations disabled in production'
      using errcode = 'P0001';
  end if;
end;
$$;

comment on function public.assert_sandbox_environment() is
  'Raises if production and no active override. Sandbox always allowed. Production + override active = allowed. Audit for mutations under override is done in API.';
