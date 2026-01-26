'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Get user's notifications
 */
export async function getUserNotifications(limit: number = 50) {
  const user = await requireAuth()
  const supabase = createServerSupabase()
  const supabaseAny = supabase as any

  const { data: notifications, error } = await supabaseAny
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    // If table doesn't exist, return empty array instead of throwing
    if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
      console.warn('Notifications table not found, returning empty array')
      return []
    }
    throw new Error(`Failed to fetch notifications: ${error.message}`)
  }

  return notifications || []
}

/**
 * Get notifications (simplified version for compatibility)
 */
export async function getNotifications(userId: string) {
  const supabase = createServerSupabase();
  const supabaseAny = supabase as any

  const { data, error } = await supabaseAny
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  const user = await requireAuth()
  const supabase = createServerSupabase()
  const supabaseAny = supabase as any

  const { data, error } = await supabaseAny
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`)
  }

  revalidatePath('/dashboard')
  return data
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead() {
  const user = await requireAuth()
  const supabase = createServerSupabase()
  const supabaseAny = supabase as any

  const { error } = await supabaseAny
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    throw new Error(`Failed to mark all notifications as read: ${error.message}`)
  }

  revalidatePath('/dashboard')
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount() {
  const user = await requireAuth()
  const supabase = createServerSupabase()
  const supabaseAny = supabase as any

  const { count, error } = await supabaseAny
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    // If table doesn't exist, return 0 instead of throwing
    if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
      return 0
    }
    return 0
  }

  return count || 0
}
