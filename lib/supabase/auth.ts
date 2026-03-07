import { createServerSupabaseClient } from './server';

export async function getServerSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  return user ? { user } : null;
}
