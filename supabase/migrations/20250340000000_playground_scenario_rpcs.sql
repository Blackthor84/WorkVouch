-- Playground scenario lifecycle RPCs. Extend with real logic; stubs return safe defaults.

-- Returns new scenario id (uuid).
create or replace function public.create_playground_scenario(name text default 'Unnamed')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  out_id uuid := gen_random_uuid();
begin
  -- Stub: insert into playground_scenarios (id, name) if table exists; else just return id.
  return out_id;
end;
$$;

-- Snapshot current scenario state; returns snapshot id (stub returns uuid).
create or replace function public.snapshot_scenario(scenario_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  out_id uuid := gen_random_uuid();
begin
  -- Stub: copy scenario state to snapshots table when ready.
  return out_id;
end;
$$;

-- Apply mass abuse (no rehire) to scenario.
create or replace function public.abuse_mass_no_rehire(scenario_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Stub: apply abuse logic to scenario_id.
  return;
end;
$$;

-- Recalculate reputation for scenario.
create or replace function public.recalc_scenario_reputation(scenario_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Stub: recalc reputation for scenario_id.
  return;
end;
$$;

-- Restore from snapshot.
create or replace function public.restore_snapshot(snapshot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Stub: restore state from snapshot_id.
  return;
end;
$$;

-- Nuclear reset for scenario.
create or replace function public.reset_playground_scenario(scenario_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Stub: reset scenario_id state.
  return;
end;
$$;

comment on function public.create_playground_scenario(text) is 'Create a playground scenario; returns scenario uuid.';
comment on function public.snapshot_scenario(uuid) is 'Snapshot scenario state; returns snapshot uuid.';
comment on function public.abuse_mass_no_rehire(uuid) is 'Apply mass abuse (no rehire) to scenario.';
comment on function public.recalc_scenario_reputation(uuid) is 'Recalc reputation for scenario.';
comment on function public.restore_snapshot(uuid) is 'Restore state from snapshot.';
comment on function public.reset_playground_scenario(uuid) is 'Reset scenario (nuclear).';
