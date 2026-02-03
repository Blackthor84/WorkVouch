import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'

export default function EmployerSearchScreen() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [filters, setFilters] = useState({
    industry: '',
    location: '',
    minTrustScore: '',
  })
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const currentUser = await getCurrentUser()
    if (!currentUser) return
    setUser(currentUser)
    await searchCandidates()
  }

  async function searchCandidates() {
    let query = supabase
      .from('profiles')
      .select('*, trust_scores(score)')
      .eq('visibility', 'public')

    if (filters.industry) {
      query = query.eq('industry', filters.industry)
    }

    if (filters.location) {
      query = query.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%`)
    }

    const { data } = await query

    if (data) {
      let filtered = data

      if (filters.minTrustScore) {
        filtered = filtered.filter((p) => {
          const score = p.trust_scores?.[0]?.score || 0
          return score >= parseInt(filters.minTrustScore)
        })
      }

      setCandidates(filtered)
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    await searchCandidates()
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
          Search Candidates
        </Text>

        {/* Filters */}
        <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
          <Text className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Filters
          </Text>
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Industry
              </Text>
              <View className="flex-row flex-wrap">
                {['law_enforcement', 'security', 'hospitality', 'retail'].map((ind) => (
                  <TouchableOpacity
                    key={ind}
                    onPress={() => setFilters({ ...filters, industry: filters.industry === ind ? '' : ind })}
                    className={`rounded-xl px-4 py-2 mr-2 mb-2 ${
                      filters.industry === ind
                        ? 'bg-primary'
                        : 'bg-primary-light dark:bg-blue-900/20'
                    }`}
                  >
                    <Text className={filters.industry === ind ? 'text-white' : 'text-primary dark:text-blue-400'}>
                      {ind.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text className="text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Location
              </Text>
              <TextInput
                value={filters.location}
                onChangeText={(text) => setFilters({ ...filters, location: text })}
                placeholder="City or State"
                className="bg-primary-light dark:bg-blue-900/20 rounded-xl px-4 py-3 text-grey-dark dark:text-gray-200"
              />
            </View>
            <View>
              <Text className="text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Min Reputation Score
              </Text>
              <TextInput
                value={filters.minTrustScore}
                onChangeText={(text) => setFilters({ ...filters, minTrustScore: text })}
                placeholder="0-100"
                keyboardType="numeric"
                className="bg-primary-light dark:bg-blue-900/20 rounded-xl px-4 py-3 text-grey-dark dark:text-gray-200"
              />
            </View>
            <TouchableOpacity
              onPress={searchCandidates}
              className="bg-primary rounded-xl py-4 items-center"
            >
              <Text className="text-white font-bold text-lg">Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        <Text className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
          {candidates.length} Candidates Found
        </Text>
        <View className="space-y-4">
          {candidates.map((candidate) => (
            <TouchableOpacity
              key={candidate.id}
              onPress={() => router.push(`/(employer)/candidate/${candidate.id}`)}
              className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 shadow-md"
            >
              <Text className="text-xl font-bold text-grey-dark dark:text-gray-200 mb-2">
                {candidate.full_name}
              </Text>
              <Text className="text-grey-medium dark:text-gray-400 mb-2">
                {candidate.city && candidate.state ? `${candidate.city}, ${candidate.state}` : 'Location not specified'}
              </Text>
              {candidate.trust_scores?.[0]?.score && (
                <Text className="text-primary font-semibold">
                  Reputation Score: {candidate.trust_scores[0].score}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}
