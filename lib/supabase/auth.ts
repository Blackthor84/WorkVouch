import { createServerSupabase } from './server';

export async function getServerSession() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { user } : null;
}
