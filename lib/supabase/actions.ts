/**
 * Server-side Actions for Supabase
 * Use these in Server Components and Server Actions
 */
import { createClient } from "@/lib/supabase/server";

export const getUserProfile = async (userId: string) => {
  const supabase = await createClient();
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
};
