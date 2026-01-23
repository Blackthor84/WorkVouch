// Simplified Supabase client export
// Uses runtime-safe initialization to prevent build-time errors
import { getSupabaseClient } from './supabaseClient';

// Export a function that returns the client (runtime-safe)
export const getSupabase = () => getSupabaseClient();

// For backward compatibility, export as supabase (but it's a function)
export const supabase = {
  auth: {
    signUp: async (credentials: { email: string; password: string }) => {
      const client = getSupabaseClient();
      return client.auth.signUp(credentials);
    },
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      const client = getSupabaseClient();
      return client.auth.signInWithPassword(credentials);
    },
  },
  from: (table: string) => {
    const client = getSupabaseClient();
    return client.from(table);
  },
};
