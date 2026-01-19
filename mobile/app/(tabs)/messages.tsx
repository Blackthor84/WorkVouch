import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'

export default function MessagesScreen() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [threads, setThreads] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
    setupRealtime()
  }, [])

  async function loadData() {
    const currentUser = await getCurrentUser()
    if (!currentUser) return
    setUser(currentUser)

    // Get message threads
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, profile_photo_url),
        recipient:profiles!messages_recipient_id_fkey(id, full_name, profile_photo_url)
      `)
      .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false })

    if (data) {
      // Group into threads
      const threadMap = new Map()
      data.forEach((msg) => {
        const otherUserId = msg.sender_id === currentUser.id ? msg.recipient_id : msg.sender_id
        const otherUser = msg.sender_id === currentUser.id ? msg.recipient : msg.sender
        
        if (!threadMap.has(otherUserId)) {
          threadMap.set(otherUserId, {
            id: otherUserId,
            user: otherUser,
            lastMessage: msg,
            unreadCount: 0,
          })
        }
        
        const thread = threadMap.get(otherUserId)
        if (msg.created_at > thread.lastMessage.created_at) {
          thread.lastMessage = msg
        }
        if (!msg.is_read && msg.recipient_id === currentUser.id) {
          thread.unreadCount++
        }
      })
      
      setThreads(Array.from(threadMap.values()))
    }
  }

  function setupRealtime() {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        () => loadData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="px-6 pt-12 pb-6">
        <Text className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-6">
          Messages
        </Text>
        
        {threads.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-grey-medium dark:text-gray-400 text-center">
              No messages yet. Start a conversation!
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {threads.map((thread) => (
              <TouchableOpacity
                key={thread.id}
                onPress={() => router.push(`/(tabs)/messages/${thread.id}`)}
                className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-4 shadow-md"
              >
                <View className="flex-row items-center">
                  {thread.user?.profile_photo_url ? (
                    <Image
                      source={{ uri: thread.user.profile_photo_url }}
                      className="w-16 h-16 rounded-full mr-4"
                    />
                  ) : (
                    <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mr-4">
                      <Text className="text-white font-semibold text-lg">
                        {thread.user?.full_name?.charAt(0) || 'U'}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-lg font-semibold text-grey-dark dark:text-gray-200">
                        {thread.user?.full_name || 'Unknown'}
                      </Text>
                      {thread.unreadCount > 0 && (
                        <View className="bg-primary rounded-full px-3 py-1">
                          <Text className="text-white text-xs font-bold">
                            {thread.unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-grey-medium dark:text-gray-400" numberOfLines={1}>
                      {thread.lastMessage.content}
                    </Text>
                    <Text className="text-xs text-grey-medium dark:text-gray-400 mt-1">
                      {new Date(thread.lastMessage.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}
