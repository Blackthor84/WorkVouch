-- admin_users: allowlist for users who can access /admin. Optional god_mode per user.
-- Layout can require a row here (redirect to 404 if missing). Service role or backoffice inserts rows.

create table if not exists public.admin_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  god_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_users_user_id on public.admin_users(user_id);

alter table public.admin_users enable row level security;

drop policy if exists "Users can read own admin_users row" on public.admin_users;
create policy "Users can read own admin_users row"
  on public.admin_users for select
  using (auth.uid() = user_id);

-- Only service role (or future backoffice) can insert/update; no policy for anon/authenticated.
comment on table public.admin_users is 'Allowlist for admin access; layout may require a row. god_mode can drive UI.';
