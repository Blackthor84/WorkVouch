import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import Animated, { FadeInDown } from 'react-native-reanimated'

const INDUSTRIES = [
  { id: 'law_enforcement', name: 'Law Enforcement', icon: '🛡️' },
  { id: 'security', name: 'Security', icon: '🔒' },
  { id: 'hospitality', name: 'Hospitality', icon: '🏨' },
  { id: 'retail', name: 'Retail', icon: '🛒' },
]

export default function IndustrySelectionScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    if (!selectedIndustry) {
      Alert.alert('Error', 'Please select an industry')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ industry: selectedIndustry })
        .eq('id', params.userId as string)

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      // Navigate to dashboard
      router.replace('/(tabs)/dashboard')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save industry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-background px-6 pt-20">
      <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
        <Text className="text-4xl font-bold text-grey-dark mb-2">Select Your Industry</Text>
        <Text className="text-lg text-grey-medium">
          Help us customize your PeerCV experience
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400)} className="space-y-4 mb-8">
        {INDUSTRIES.map((industry) => (
          <TouchableOpacity
            key={industry.id}
            onPress={() => setSelectedIndustry(industry.id)}
            className={`bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 border-2 ${
              selectedIndustry === industry.id
                ? 'border-primary bg-primary-light dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-[#374151]'
            }`}
          >
            <View className="flex-row items-center">
              <Text className="text-4xl mr-4">{industry.icon}</Text>
              <Text className="text-xl font-semibold text-grey-dark dark:text-gray-200 flex-1">
                {industry.name}
              </Text>
              {selectedIndustry === industry.id && (
                <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
                  <Text className="text-white text-xs">✓</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </Animated.View>

      <TouchableOpacity
        onPress={handleContinue}
        disabled={loading || !selectedIndustry}
        className="bg-primary rounded-xl py-4 items-center mb-8"
        style={{ opacity: loading || !selectedIndustry ? 0.5 : 1 }}
      >
        <Text className="text-white font-bold text-lg">
          {loading ? 'Saving...' : 'Continue'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
