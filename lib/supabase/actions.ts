/**
 * Server-side Actions for Supabase
 * Use these in Server Components and Server Actions
 */
import { createSupabaseServerClient } from "./server";

export const getUserProfile = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
};
