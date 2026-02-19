-- Returns heatmap data for ReputationHeatmap: rows with x (bucket label), y (bucket label), value (count).
-- Use from client: supabase.rpc("get_reputation_heatmap", { scenario_id }).
create or replace function public.get_reputation_heatmap(scenario_id uuid)
returns table (x text, y text, value integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Stub: return sample grid; replace with real aggregation over scenario reputation/buckets.
  return query
  select * from (values
    ('0-20'::text,   'Q1'::text, 5),
    ('20-40',  'Q1', 12),
    ('40-60',  'Q1', 8),
    ('60-80',  'Q1', 3),
    ('80-100', 'Q1', 2),
    ('0-20',   'Q2', 3),
    ('20-40',  'Q2', 15),
    ('40-60',  'Q2', 10),
    ('60-80',  'Q2', 7),
    ('80-100', 'Q2', 4)
  ) as t(x, y, value);
end;
$$;

comment on function public.get_reputation_heatmap(uuid) is 'Heatmap data for a playground scenario (x, y bucket labels and count).';
