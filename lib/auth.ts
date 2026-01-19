import { createServerClient } from './supabase/server'

export interface User {
  id: string
  email?: string
}

export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  industry: string | null
  city: string | null
  state: string | null
  profile_photo_url: string | null
  professional_summary: string | null
  visibility: 'public' | 'private'
  created_at: string
  updated_at: string
}

/**
 * Get current authenticated user
 * Uses Supabase auth.getUser() for security
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return {
    id: user.id,
    email: user.email,
  }
}

/**
 * Get current user profile from Supabase
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }

  const supabase = await createServerClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return null
  }

  return profile as UserProfile
}

/**
 * Get current user roles
 */
export async function getCurrentUserRoles(): Promise<string[]> {
  const user = await getCurrentUser()
  if (!user) {
    return []
  }

  const supabase = await createServerClient()
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  if (!roles || roles.length === 0) {
    return []
  }

  return roles.map(r => r.role)
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const roles = await getCurrentUserRoles()
  return roles.includes(role)
}

/**
 * Check if current user is an employer
 */
export async function isEmployer(): Promise<boolean> {
  return hasRole('employer')
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const roles = await getCurrentUserRoles()
  return roles.includes('admin') || roles.includes('superadmin')
}

/**
 * Check if current user is a superadmin
 */
export async function isSuperAdmin(): Promise<boolean> {
  return hasRole('superadmin')
}

/**
 * Check if user is superadmin or has specific role
 * Superadmin bypasses all role checks
 */
export async function hasRoleOrSuperadmin(role: string): Promise<boolean> {
  const roles = await getCurrentUserRoles()
  return roles.includes('superadmin') || roles.includes(role)
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
