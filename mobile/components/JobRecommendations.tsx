import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'

interface JobRecommendationsProps {
  userId?: string
}

export function JobRecommendations({ userId }: JobRecommendationsProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    loadRecommendations()
  }, [userId])

  async function loadRecommendations() {
    if (!userId) return

    // Get published job postings
    const { data } = await supabase
      .from('job_postings')
      .select('*')
      .eq('status', 'Published')
      .limit(5)

    if (data) {
      setJobs(data)
    }
  }

  if (jobs.length === 0) return null

  return (
    <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
      <Text className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
        Recommended Jobs
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {jobs.map((job) => (
          <TouchableOpacity
            key={job.id}
            onPress={() => router.push(`/(tabs)/job-matches`)}
            className="bg-primary-light dark:bg-blue-900/20 rounded-xl p-4 mr-3 w-64"
          >
            <Text className="text-lg font-bold text-grey-dark dark:text-gray-200 mb-2">
              {job.title}
            </Text>
            <Text className="text-sm text-grey-medium dark:text-gray-400 mb-2">
              {job.location}
            </Text>
            {job.pay_range_min && job.pay_range_max && (
              <Text className="text-sm font-semibold text-primary">
                ${job.pay_range_min} - ${job.pay_range_max}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}
