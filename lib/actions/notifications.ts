'use server'

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";
import { revalidatePath } from 'next/cache'

async function requireNotificationSessionUser() {
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return user;
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(limit: number = 50) {
  const user = await requireNotificationSessionUser();
  const supabase = await createClient()
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
  const supabase = await createClient();
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
  const supabase = await createClient()
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
  const user = await requireNotificationSessionUser();
  const supabase = await createClient()
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
  revalidatePath('/notifications')
}

/**
 * Get unread notification count. Safe for Server Components and server actions.
 * Never throws: no user, query failure, or null count → 0.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const user = await getUser();
    if (!user?.id) return 0

    const supabase = await createClient()
    const supabaseAny = supabase as any

    const { count, error } = await supabaseAny
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}
