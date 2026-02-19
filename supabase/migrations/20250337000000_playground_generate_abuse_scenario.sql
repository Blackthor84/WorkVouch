-- playground_generate_abuse_scenario: stub for admin abuse simulation. Extend with real logic as needed.
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
  -- Placeholder: log or extend with real scenario data generation.
  -- Only callable by service role or from admin API; RLS does not apply to definer.
  if employee_count < 1 or employee_count > 100000 then
    raise exception 'employee_count must be between 1 and 100000';
  end if;
  -- No-op for now; add inserts/updates for abuse scenario when ready.
  return;
end;
$$;

comment on function public.playground_generate_abuse_scenario(text, int, boolean) is
  'Playground: generate mass abuse scenario (admin only). Params: employer_name, employee_count, mass_rehire.';
