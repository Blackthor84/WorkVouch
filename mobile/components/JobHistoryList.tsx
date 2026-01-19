import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

interface JobHistoryListProps {
  jobs: any[]
}

export function JobHistoryList({ jobs }: JobHistoryListProps) {
  const router = useRouter()

  return (
    <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-semibold text-grey-dark dark:text-gray-200">
          Job History
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
          <Text className="text-primary font-semibold">Add Job</Text>
        </TouchableOpacity>
      </View>
      {jobs.length === 0 ? (
        <Text className="text-grey-medium dark:text-gray-400 text-center py-4">
          No job history yet. Add your first job to get started.
        </Text>
      ) : (
        <View className="space-y-3">
          {jobs.slice(0, 5).map((job) => (
            <View
              key={job.id}
              className="bg-primary-light dark:bg-blue-900/20 rounded-xl p-4"
            >
              <Text className="text-lg font-semibold text-grey-dark dark:text-gray-200">
                {job.job_title}
              </Text>
              <Text className="text-grey-medium dark:text-gray-400">
                {job.company_name}
              </Text>
              <Text className="text-sm text-grey-medium dark:text-gray-400 mt-1">
                {new Date(job.start_date).toLocaleDateString()} -{' '}
                {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Present'}
              </Text>
              {job.is_private && (
                <View className="mt-2">
                  <Text className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Private - Not visible to employers
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
