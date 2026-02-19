-- RPC: is_feature_enabled(flag_key) — returns true when the flag is globally enabled
-- or the current user has an assignment. Use from app: supabase.rpc('is_feature_enabled', { flag_key: 'new_scoring' }).
-- SECURITY DEFINER so it can read feature_flags / feature_flag_assignments despite RLS.

create or replace function public.is_feature_enabled(flag_key text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.feature_flags ff
    where ff.key = flag_key
      and (
        ff.is_globally_enabled = true
        or exists (
          select 1
          from public.feature_flag_assignments ffa
          where ffa.feature_flag_id = ff.id
            and ffa.user_id = auth.uid()
            and ffa.enabled = true
        )
      )
  );
$$;

comment on function public.is_feature_enabled(text) is
  'Returns true if feature flag key is globally enabled or enabled for the current user (auth.uid()).';
