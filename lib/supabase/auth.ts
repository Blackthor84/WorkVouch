import { createServerSupabaseClient } from './server';

export async function getServerSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { user } : null;
}
