/**
 * Auth Functions for Supabase
 * Client-side authentication helpers
 */
import { supabaseClient } from "./client";

export const signUpUser = async (email: string, password: string) => {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};
