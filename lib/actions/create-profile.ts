'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

/**
 * Manually create profile for current user if it doesn't exist
 * This is a fallback if the trigger doesn't work
 */
export async function createProfileIfMissing() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const supabase = await createServerClient()
  const supabaseAny = supabase as any

  // Check if profile exists
  const { data: existingProfile } = await supabaseAny
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (existingProfile) {
    return { success: true, message: 'Profile already exists' }
  }

  // Get user metadata
  const { data: authUser } = await supabase.auth.getUser()
  const fullName = authUser?.user?.user_metadata?.full_name || 'User'

  // Create profile (using service role would bypass RLS, but we'll try with current user)
  const { data: profile, error: profileError } = await supabaseAny
    .from('profiles')
    .insert([{
      id: user.id,
      full_name: fullName,
      email: user.email || '',
    }])
    .select()
    .single()

  if (profileError) {
    console.error('Profile creation error:', profileError)
    throw new Error(`Failed to create profile: ${profileError.message}`)
  }

  // Check if role exists
  const { data: existingRole } = await supabaseAny
    .from('user_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('role', 'user')
    .single()

  if (!existingRole) {
    // Try to add role (might fail due to RLS, but trigger should handle it)
    await supabaseAny.from('user_roles').insert([{
      user_id: user.id,
      role: 'user',
    }])
  }

  return { success: true, profile }
}
