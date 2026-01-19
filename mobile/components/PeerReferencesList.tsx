import { View, Text, Image } from 'react-native'

interface PeerReferencesListProps {
  references: any[]
}

export function PeerReferencesList({ references }: PeerReferencesListProps) {
  return (
    <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
      <Text className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
        Peer References
      </Text>
      {references.length === 0 ? (
        <Text className="text-grey-medium dark:text-gray-400 text-center py-4">
          No references yet. Request references from coworkers to build your profile.
        </Text>
      ) : (
        <View className="space-y-4">
          {references.map((ref) => (
            <View
              key={ref.id}
              className="bg-primary-light dark:bg-blue-900/20 rounded-xl p-4"
            >
              <View className="flex-row items-center mb-2">
                {ref.from_user?.profile_photo_url ? (
                  <Image
                    source={{ uri: ref.from_user.profile_photo_url }}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-primary items-center justify-center mr-3">
                    <Text className="text-white font-semibold">
                      {ref.from_user?.full_name?.charAt(0) || 'R'}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="font-semibold text-grey-dark dark:text-gray-200">
                    {ref.from_user?.full_name || 'Anonymous'}
                  </Text>
                  <View className="flex-row mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Text key={i} className="text-yellow-400">
                        {i < ref.rating ? '★' : '☆'}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
              {ref.written_feedback && (
                <Text className="text-grey-medium dark:text-gray-400 italic mt-2">
                  "{ref.written_feedback}"
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
