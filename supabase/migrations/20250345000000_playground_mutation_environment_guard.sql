-- ============================================================================
-- Playground / sandbox mutation RPCs: environment guard.
-- If app.environment = 'production' (or unset), raise. Sandbox only.
-- API must set app.environment via set_config('app.environment', 'sandbox', true) in sandbox.
-- ============================================================================

create or replace function public.assert_sandbox_environment()
returns void
language plpgsql
stable
as $$
declare
  env text := coalesce(nullif(trim(current_setting('app.environment', true)), ''), 'production');
begin
  if env = 'production' then
    raise exception 'Mutations disabled in production'
      using errcode = 'P0001';
  end if;
end;
$$;

comment on function public.assert_sandbox_environment() is
  'Raises if current_setting(app.environment) is production or unset. Call at start of mutation RPCs.';

-- API calls this before mutation RPCs when app is in sandbox so assert_sandbox_environment() passes.
create or replace function public.set_app_environment(env text)
returns void
language sql
security definer
set search_path = public
as $$
  select set_config('app.environment', coalesce(nullif(trim(env), ''), 'production'), true);
$$;

comment on function public.set_app_environment(text) is
  'Set app.environment for the current transaction. Call from API before mutation RPCs when in sandbox.';

-- Guard: create_playground_scenario
create or replace function public.create_playground_scenario(name text default 'Unnamed')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  out_id uuid := gen_random_uuid();
begin
  perform public.assert_sandbox_environment();
  return out_id;
end;
$$;

-- Guard: snapshot_scenario
create or replace function public.snapshot_scenario(scenario_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  out_id uuid := gen_random_uuid();
begin
  perform public.assert_sandbox_environment();
  return out_id;
end;
$$;

-- Guard: abuse_mass_no_rehire
create or replace function public.abuse_mass_no_rehire(scenario_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_sandbox_environment();
  return;
end;
$$;

-- Guard: recalc_scenario_reputation
create or replace function public.recalc_scenario_reputation(scenario_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_sandbox_environment();
  return;
end;
$$;

-- Guard: restore_snapshot
create or replace function public.restore_snapshot(snapshot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_sandbox_environment();
  return;
end;
$$;

-- Guard: reset_playground_scenario
create or replace function public.reset_playground_scenario(scenario_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_sandbox_environment();
  return;
end;
$$;

-- Guard: playground_generate_abuse_scenario
create or replace function public.playground_generate_abuse_scenario(
  employer_name text default 'Evil Corp',
  employee_count int default 1000,
  mass_rehire boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_sandbox_environment();
  if employee_count < 1 or employee_count > 100000 then
    raise exception 'employee_count must be between 1 and 100000';
  end if;
  return;
end;
$$;

-- Guard: playground_small / medium / large / reset_playground (stubs)
create or replace function public.playground_small()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_sandbox_environment();
  return;
end;
$$;

create or replace function public.playground_medium()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_sandbox_environment();
  return;
end;
$$;

create or replace function public.playground_large()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_sandbox_environment();
  return;
end;
$$;

create or replace function public.reset_playground()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_sandbox_environment();
  return;
end;
$$;
