import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import Animated, { FadeIn } from 'react-native-reanimated'

export default function SplashScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const session = await getSession()
      
      // Small delay for splash animation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (session) {
        // Check if user is employer
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if ((profile as { role?: string })?.role === 'employer') {
          router.replace('/(employer)/dashboard')
        } else {
          router.replace('/(tabs)/dashboard')
        }
      } else {
        router.replace('/(auth)/login')
      }
    } catch (error) {
      router.replace('/(auth)/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Animated.View 
      entering={FadeIn.duration(800)}
      className="flex-1 bg-primary items-center justify-center"
    >
      <View className="items-center">
        {/* PeerCV Logo */}
        <View className="bg-white rounded-3xl p-8 mb-8 shadow-lg">
          <Text className="text-4xl font-bold text-primary">PeerCV</Text>
        </View>
        {loading && (
          <ActivityIndicator size="large" color="#FFFFFF" />
        )}
      </View>
    </Animated.View>
  )
}
