import { useState, useEffect } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { TrustScoreCard } from '@/components/TrustScoreCard'
import { QuickShortcuts } from '@/components/QuickShortcuts'
import { JobRecommendations } from '@/components/JobRecommendations'

export default function DashboardScreen() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [trustScore, setTrustScore] = useState<number>(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.replace('/(auth)/login')
      return
    }

    setUser(currentUser)
    const userProfile = await getUserProfile(currentUser.id)
    setProfile(userProfile)

    // Get reputation score (internal: trust_score)
    const { data } = await supabase
      .from('trust_scores')
      .select('score')
      .eq('user_id', currentUser.id)
      .single()

    if (data) {
      setTrustScore(data.score || 0)
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
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-grey-dark dark:text-gray-200">
            Dashboard
          </Text>
          <Text className="text-lg text-grey-medium dark:text-gray-400 mt-1">
            Welcome back, {profile?.full_name || user?.email}
          </Text>
        </View>

        {/* Reputation Score Card */}
        <TrustScoreCard score={trustScore} userId={user?.id} />

        {/* Industry Badge */}
        {profile?.industry && (
          <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-4 mb-4 shadow-md">
            <Text className="text-sm text-grey-medium dark:text-gray-400 mb-1">Industry</Text>
            <Text className="text-lg font-semibold text-grey-dark dark:text-gray-200 capitalize">
              {profile.industry.replace('_', ' ')}
            </Text>
          </View>
        )}

        {/* Quick Shortcuts */}
        <QuickShortcuts />

        {/* Job History Status */}
        <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
          <Text className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Job History
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            className="bg-primary-light dark:bg-blue-900/20 rounded-xl p-4"
          >
            <Text className="text-primary dark:text-blue-400 font-semibold text-center">
              View & Manage Jobs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Coworker Matches */}
        <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold text-grey-dark dark:text-gray-200">
              Coworker Matches
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Text className="text-primary font-semibold">View All</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-grey-medium dark:text-gray-400">
            Find people you've worked with
          </Text>
        </View>

        {/* AI Job Recommendations */}
        <JobRecommendations userId={user?.id} />
      </View>
    </ScrollView>
  )
}
