'use server'

import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { ProfileVisibility } from '@/types/database'

/**
 * Update user profile
 */
export async function updateProfile(data: {
  full_name?: string
  city?: string
  state?: string
  professional_summary?: string
  visibility?: ProfileVisibility
}) {
  const user = await requireAuth()
  const supabase = await createServerClient()
  const supabaseAny = supabase as any

  const { data: profile, error } = await supabaseAny
    .from('profiles')
    .update(data)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  revalidatePath('/dashboard')
  return profile
}

/**
 * Upload profile photo
 * Note: This is a placeholder - implement actual file upload using Supabase Storage
 */
export async function uploadProfilePhoto(file: File) {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // TODO: Implement file upload to Supabase Storage
  // For now, return a placeholder URL
  // In production, upload to: profiles/{user_id}/photo.{ext}
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/photo.${fileExt}`
  
  // This would be the actual upload:
  // const { data, error } = await supabase.storage
  //   .from('profile-photos')
  //   .upload(fileName, file, { upsert: true })
  
  // For now, return a placeholder
  const photoUrl = `/api/placeholder/${fileName}`
  
  const supabaseAny = supabase as any
  const { error } = await supabaseAny
    .from('profiles')
    .update({ profile_photo_url: photoUrl })
    .eq('id', user.id)

  if (error) {
    throw new Error(`Failed to update profile photo: ${error.message}`)
  }

  revalidatePath('/dashboard')
  return { url: photoUrl }
}

