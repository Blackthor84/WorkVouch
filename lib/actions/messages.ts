'use server'

// Re-export employer messages for user access
// Note: Can't use re-export in "use server" files, so we create wrapper functions
import {
  getMessages as getMessagesFromEmployer,
  sendMessage as sendMessageFromEmployer,
  getMessageThread as getMessageThreadFromEmployer,
  markMessageAsRead as markMessageAsReadFromEmployer,
  getUnreadMessageCount as getUnreadMessageCountFromEmployer,
  type Message,
} from './employer/messages'

// Re-export the type
export type { Message }

// Wrapper functions (required for "use server" files)
export async function getMessages() {
  return getMessagesFromEmployer()
}

export async function sendMessage(
  recipientId: string,
  body: string,
  subject?: string,
  relatedJobPostingId?: string
) {
  return sendMessageFromEmployer(recipientId, body, subject, relatedJobPostingId)
}

export async function getMessageThread(otherUserId: string) {
  return getMessageThreadFromEmployer(otherUserId)
}

export async function markMessageAsRead(messageId: string) {
  return markMessageAsReadFromEmployer(messageId)
}

export async function getUnreadMessageCount() {
  return getUnreadMessageCountFromEmployer()
}
