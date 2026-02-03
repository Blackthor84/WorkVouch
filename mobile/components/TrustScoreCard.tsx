import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface TrustScoreCardProps {
  score: number
  userId?: string
}

export function TrustScoreCard({ score }: TrustScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981' // Green
    if (score >= 60) return '#3B82F6' // Blue
    if (score >= 40) return '#F59E0B' // Yellow
    return '#EF4444' // Red
  }

  return (
    <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
      <Text className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
        Reputation Score
      </Text>
      <View className="items-center">
        <View className="w-32 h-32 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: getScoreColor(score) + '20' }}
        >
          <Text className="text-5xl font-bold" style={{ color: getScoreColor(score) }}>
            {Math.round(score)}
          </Text>
        </View>
        <Text className="text-grey-medium dark:text-gray-400 text-center">
          Your verified work history and peer references
        </Text>
      </View>
    </View>
  )
}
