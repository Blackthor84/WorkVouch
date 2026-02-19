-- Allow users to update their own admin_users row (e.g. god_mode toggle).
drop policy if exists "Users can update own admin_users row" on public.admin_users;
create policy "Users can update own admin_users row"
  on public.admin_users for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
