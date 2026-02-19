-- Scenario analytics RPCs for AdminAnalyticsDashboard. Replace stubs with real queries.

-- Rehire breakdown: would_rehire + total per scenario (for RehirePieChart).
create or replace function public.get_rehire_breakdown(scenario_id uuid)
returns table (playground_scenario_id uuid, would_rehire boolean, total bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Stub: replace with real aggregation for scenario_id.
  return query
  select scenario_id as playground_scenario_id, true as would_rehire, 45::bigint as total
  union all
  select scenario_id, false, 30::bigint;
end;
$$;

comment on function public.get_rehire_breakdown(uuid) is 'Rehire yes/no counts for a playground scenario.';

-- Employer damage: job_id + avg_rating per scenario (for EmployerDamageBarChart).
create or replace function public.get_employer_damage(scenario_id uuid)
returns table (job_id text, avg_rating numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Stub: replace with real aggregation for scenario_id.
  return query
  select * from (values
    ('job-1'::text, 4.2::numeric),
    ('job-2', 3.1),
    ('job-3', 2.8)
  ) as t(job_id, avg_rating);
end;
$$;

comment on function public.get_employer_damage(uuid) is 'Per-job avg rating for a scenario (employer damage view).';

-- Heatmap cells: would_rehire + intensity + reputation_score (for ReputationHeatmap grid).
create or replace function public.get_reputation_heatmap_cells(scenario_id uuid)
returns table (would_rehire boolean, intensity numeric, reputation_score integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Stub: return sample cells; replace with real scenario data.
  return query
  select * from (values
    (true::boolean, 0.8::numeric, 85),
    (true, 0.6, 72),
    (false, 0.5, 45),
    (true, 0.9, 92),
    (false, 0.4, 38)
  ) as t(would_rehire, intensity, reputation_score);
end;
$$;

comment on function public.get_reputation_heatmap_cells(uuid) is 'Per-cell heatmap data (would_rehire, intensity, reputation_score) for a scenario.';
