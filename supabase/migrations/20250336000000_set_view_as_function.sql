-- set_view_as: set session config app.view_as for "view as" / impersonation.
-- Read elsewhere with: current_setting('app.view_as', true)
-- is_local = true: setting lasts for current transaction only; use false for session scope.

create or replace function public.set_view_as(user_uuid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  select set_config('app.view_as', user_uuid::text, true);
$$;

comment on function public.set_view_as(uuid) is
  'Set app.view_as to the given user UUID for the current transaction. Read with current_setting(''app.view_as'', true).';

-- effective_user_id: for RLS and SQL. When app.view_as is set, that user; else auth.uid().
create or replace function public.effective_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(trim(current_setting('app.view_as', true)), '')::uuid,
    auth.uid()
  );
$$;

comment on function public.effective_user_id() is
  'Returns current_setting(''app.view_as'', true)::uuid when set, otherwise auth.uid(). Use in RLS: auth.uid() = effective_user_id() or row checks vs effective_user_id().';
