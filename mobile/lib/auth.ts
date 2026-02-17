import { supabase } from './supabase/client'
import { Session, User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  industry: string | null
  city: string | null
  state: string | null
  profile_photo_url: string | null
  visibility: 'public' | 'private'
}

export interface UserRole {
  role: 'user' | 'employer' | 'admin'
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as UserProfile
}

/**
 * Get user roles from profiles.role
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data?.role) return []
  return [{ role: data.role }] as UserRole[]
}

/**
 * Check if user is employer
 */
export async function isEmployer(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId)
  return roles.some(r => r.role === 'employer' || r.role === 'admin')
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })
  return { data, error }
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'peercv://reset-password',
  })
  return { data, error }
}
