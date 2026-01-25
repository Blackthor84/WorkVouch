-- Create ads table
create table if not exists public.ads (
  id uuid primary key default uuid_generate_v4(),

  employer_id uuid references public.employers(id) on delete cascade,
  ad_type text not null,

  image_url text,
  target_city text,
  target_career text,

  start_date timestamptz not null default now(),
  end_date timestamptz not null,

  price numeric not null,
  active boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
create index if not exists ads_employer_id_idx on public.ads(employer_id);
create index if not exists ads_active_idx on public.ads(active);
create index if not exists ads_target_career_idx on public.ads(target_career);
create index if not exists ads_target_city_idx on public.ads(target_city);

-- Enable RLS
alter table public.ads enable row level security;

-- RLS Policies
-- Admins can see all ads
create policy "Admins can view all ads" on public.ads
  for select using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('admin', 'superadmin')
    )
  );

-- Admins can insert ads
create policy "Admins can insert ads" on public.ads
  for insert with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('admin', 'superadmin')
    )
  );

-- Admins can update ads
create policy "Admins can update ads" on public.ads
  for update using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('admin', 'superadmin')
    )
  );

-- Admins can delete ads
create policy "Admins can delete ads" on public.ads
  for delete using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('admin', 'superadmin')
    )
  );

-- Public can view active ads (for display on pages)
create policy "Public can view active ads" on public.ads
  for select using (
    active = true
    and end_date > now()
    and start_date <= now()
  );
