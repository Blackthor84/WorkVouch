'use server'

import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject: string | null
  body: string
  is_read: boolean
  related_job_posting_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Send a message
 */
export async function sendMessage(
  recipientId: string,
  body: string,
  subject?: string,
  relatedJobPostingId?: string
) {
  const user = await requireAuth()
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      subject,
      body,
      related_job_posting_id: relatedJobPostingId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`)
  }

  // Create notification for recipient
  await supabase.rpc('create_notification', {
    p_user_id: recipientId,
    p_type: 'message',
    p_title: 'New Message',
    p_message: `You have a new message from ${user.email}`,
    p_related_user_id: user.id,
    p_related_job_id: relatedJobPostingId || null,
    p_related_connection_id: null,
    p_related_reference_id: null,
  })

  revalidatePath('/employer/messages')
  revalidatePath('/messages')
  return data as Message
}

/**
 * Get all messages for current user (inbox)
 */
export async function getMessages() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, email, profile_photo_url),
      recipient:profiles!messages_recipient_id_fkey(id, full_name, email, profile_photo_url),
      job_posting:job_postings(id, title)
    `)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`)
  }

  return data || []
}

/**
 * Get message thread between two users
 */
export async function getMessageThread(otherUserId: string) {
  const user = await requireAuth()
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, email, profile_photo_url),
      recipient:profiles!messages_recipient_id_fkey(id, full_name, email, profile_photo_url)
    `)
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch message thread: ${error.message}`)
  }

  return data || []
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string) {
  const user = await requireAuth()
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId)
    .eq('recipient_id', user.id)

  if (error) {
    throw new Error(`Failed to mark message as read: ${error.message}`)
  }

  revalidatePath('/employer/messages')
  revalidatePath('/messages')
}

/**
 * Get unread message count
 */
export async function getUnreadMessageCount() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  if (error) {
    return 0
  }

  return count || 0
}
