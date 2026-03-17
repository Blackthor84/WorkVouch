"use client";

import { supabaseBrowser } from "@/lib/supabase/browser";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseBrowser.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) console.error(error);
  return { data, error };
}

export async function signUp(email: string, password: string, options?: { redirectTo?: string }) {
  const { data, error } = await supabaseBrowser.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: options?.redirectTo ? { emailRedirectTo: options.redirectTo } : undefined,
  });
  if (error) console.error(error);
  return { data, error };
}
