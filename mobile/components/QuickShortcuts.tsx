import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const shortcuts = [
  { icon: 'person', label: 'Profile', route: '/(tabs)/profile' },
  { icon: 'briefcase', label: 'Job History', route: '/(tabs)/profile' },
  { icon: 'people', label: 'Coworkers', route: '/(tabs)/profile' },
  { icon: 'chatbubbles', label: 'Messages', route: '/(tabs)/messages' },
]

export function QuickShortcuts() {
  const router = useRouter()

  return (
    <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
      <Text className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
        Quick Actions
      </Text>
      <View className="flex-row flex-wrap justify-between">
        {shortcuts.map((shortcut) => (
          <TouchableOpacity
            key={shortcut.label}
            onPress={() => router.push(shortcut.route as any)}
            className="w-[48%] bg-primary-light dark:bg-blue-900/20 rounded-xl p-4 mb-3 items-center"
          >
            <Ionicons name={shortcut.icon as any} size={32} color="#0A84FF" />
            <Text className="text-primary dark:text-blue-400 font-semibold mt-2">
              {shortcut.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}
