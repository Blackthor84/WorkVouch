import { useState, useEffect } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'

export default function EmployerDashboardScreen() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    activeJobs: 0,
    applications: 0,
    savedCandidates: 0,
    messages: 0,
  })
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const currentUser = await getCurrentUser()
    if (!currentUser) return
    setUser(currentUser)

    // Get stats
    const [jobsRes, candidatesRes, messagesRes] = await Promise.all([
      supabase.from('job_postings').select('id').eq('employer_id', currentUser.id).eq('status', 'Published'),
      supabase.from('saved_candidates').select('id').eq('employer_id', currentUser.id),
      supabase.from('messages').select('id').eq('recipient_id', currentUser.id).eq('is_read', false),
    ])

    setStats({
      activeJobs: jobsRes.data?.length || 0,
      savedCandidates: candidatesRes.data?.length || 0,
      messages: messagesRes.data?.length || 0,
      applications: 0, // Would calculate from applications table
    })
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
          Employer Dashboard
        </Text>

        {/* Quick Stats */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="w-[48%] bg-white dark:bg-[#1A1F2B] rounded-2xl p-4 mb-4 shadow-md">
            <Text className="text-3xl font-bold text-primary mb-1">{stats.activeJobs}</Text>
            <Text className="text-grey-medium dark:text-gray-400">Active Jobs</Text>
          </View>
          <View className="w-[48%] bg-white dark:bg-[#1A1F2B] rounded-2xl p-4 mb-4 shadow-md">
            <Text className="text-3xl font-bold text-primary mb-1">{stats.applications}</Text>
            <Text className="text-grey-medium dark:text-gray-400">Applications</Text>
          </View>
          <View className="w-[48%] bg-white dark:bg-[#1A1F2B] rounded-2xl p-4 shadow-md">
            <Text className="text-3xl font-bold text-primary mb-1">{stats.savedCandidates}</Text>
            <Text className="text-grey-medium dark:text-gray-400">Saved Candidates</Text>
          </View>
          <View className="w-[48%] bg-white dark:bg-[#1A1F2B] rounded-2xl p-4 shadow-md">
            <Text className="text-3xl font-bold text-primary mb-1">{stats.messages}</Text>
            <Text className="text-grey-medium dark:text-gray-400">New Messages</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
          <Text className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Quick Actions
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(employer)/job-posts')}
            className="bg-primary rounded-xl py-4 items-center mb-3"
          >
            <Text className="text-white font-bold text-lg">Post New Job</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(employer)/search')}
            className="bg-primary-light dark:bg-blue-900/20 rounded-xl py-4 items-center"
          >
            <Text className="text-primary dark:text-blue-400 font-semibold text-lg">
              Search Candidates
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subscription Status */}
        <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
          <Text className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
            Subscription
          </Text>
          <Text className="text-grey-medium dark:text-gray-400 mb-4">
            Pro Plan - Active
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(employer)/settings')}
            className="bg-primary-light dark:bg-blue-900/20 rounded-xl py-3 items-center"
          >
            <Text className="text-primary dark:text-blue-400 font-semibold">
              Manage Subscription
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}
