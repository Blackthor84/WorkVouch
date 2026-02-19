-- Stub RPCs for admin playground. Extend with real logic as needed.

create or replace function public.playground_small()
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Small demo scenario
  return;
end;
$$;

create or replace function public.playground_medium()
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Medium demo scenario
  return;
end;
$$;

create or replace function public.playground_large()
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Large demo scenario
  return;
end;
$$;

create or replace function public.reset_playground()
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Reset playground data
  return;
end;
$$;
