-- Table for rehire breakdown per scenario (used by useRehireBreakdown / RehirePieChart).
create table if not exists public.playground_rehire_breakdown (
  id uuid primary key default gen_random_uuid(),
  playground_scenario_id uuid not null,
  would_rehire boolean not null,
  total bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_playground_rehire_breakdown_scenario
  on public.playground_rehire_breakdown (playground_scenario_id);

comment on table public.playground_rehire_breakdown is 'Aggregated rehire yes/no counts per playground scenario.';
