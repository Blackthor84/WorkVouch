import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'

export default function JobMatchesScreen() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const currentUser = await getCurrentUser()
    if (!currentUser) return
    setUser(currentUser)

    // Get published job postings
    const { data } = await supabase
      .from('job_postings')
      .select('*')
      .eq('status', 'Published')
      .order('created_at', { ascending: false })

    if (data) {
      // Calculate fit scores (simplified - would use AI in production)
      const jobsWithScores = data.map((job) => ({
        ...job,
        fitScore: calculateFitScore(job, currentUser.id),
      }))
      jobsWithScores.sort((a, b) => b.fitScore - a.fitScore)
      setJobs(jobsWithScores)
    }
  }

  function calculateFitScore(job: any, userId: string): number {
    // Simplified scoring - would use AI matching in production
    let score = 50 // Base score
    
    // Add scoring logic based on user profile, industry match, etc.
    // This is a placeholder - real implementation would use AI
    
    return Math.min(100, score)
  }

  async function onRefresh() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  async function handleSaveJob(jobId: string) {
    // Save job to user's saved jobs
    Alert.alert('Success', 'Job saved!')
  }

  async function handleApply(jobId: string) {
    router.push(`/(tabs)/job-matches/${jobId}/apply`)
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
          Job Matches
        </Text>
        
        {jobs.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-grey-medium dark:text-gray-400 text-center">
              No job matches found. Check back later!
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {jobs.map((job) => (
              <View
                key={job.id}
                className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 shadow-md"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-grey-dark dark:text-gray-200 mb-1">
                      {job.title}
                    </Text>
                    <Text className="text-grey-medium dark:text-gray-400">
                      {job.location}
                    </Text>
                  </View>
                  <View className="bg-primary rounded-full px-4 py-2">
                    <Text className="text-white font-bold">
                      {job.fitScore}% Match
                    </Text>
                  </View>
                </View>
                
                <Text className="text-grey-dark dark:text-gray-200 mb-4" numberOfLines={3}>
                  {job.description}
                </Text>
                
                {job.pay_range_min && job.pay_range_max && (
                  <Text className="text-lg font-semibold text-primary mb-4">
                    ${job.pay_range_min} - ${job.pay_range_max}
                  </Text>
                )}
                
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => handleSaveJob(job.id)}
                    className="flex-1 bg-primary-light dark:bg-blue-900/20 rounded-xl py-3 items-center"
                  >
                    <Text className="text-primary dark:text-blue-400 font-semibold">
                      Save
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleApply(job.id)}
                    className="flex-1 bg-primary rounded-xl py-3 items-center"
                  >
                    <Text className="text-white font-semibold">
                      Apply
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}
