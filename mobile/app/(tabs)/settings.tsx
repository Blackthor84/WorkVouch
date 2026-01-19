import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { getCurrentUser } from '@/lib/auth'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import * as Notifications from 'expo-notifications'

export default function SettingsScreen() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)

  useEffect(() => {
    loadData()
    checkNotificationPermissions()
  }, [])

  async function loadData() {
    const currentUser = await getCurrentUser()
    setUser(currentUser)
  }

  async function checkNotificationPermissions() {
    const { status } = await Notifications.getPermissionsAsync()
    setNotificationsEnabled(status === 'granted')
  }

  async function handleLogout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut()
            router.replace('/(auth)/login')
          },
        },
      ]
    )
  }

  async function toggleNotifications(value: boolean) {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync()
      setNotificationsEnabled(status === 'granted')
    } else {
      setNotificationsEnabled(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-12 pb-6">
        <Text className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-6">
          Settings
        </Text>

        {/* Account Section */}
        <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
          <Text className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Account
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            className="py-4 border-b border-gray-200 dark:border-[#374151]"
          >
            <Text className="text-grey-dark dark:text-gray-200">Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/reset-password')}
            className="py-4 border-b border-gray-200 dark:border-[#374151]"
          >
            <Text className="text-grey-dark dark:text-gray-200">Change Password</Text>
          </TouchableOpacity>
          <View className="py-4">
            <Text className="text-grey-dark dark:text-gray-200">Email: {user?.email}</Text>
          </View>
        </View>

        {/* Notifications Section */}
        <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
          <Text className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Notifications
          </Text>
          <View className="flex-row justify-between items-center py-4 border-b border-gray-200 dark:border-[#374151]">
            <Text className="text-grey-dark dark:text-gray-200">Push Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: '#0A84FF' }}
            />
          </View>
          <View className="flex-row justify-between items-center py-4">
            <Text className="text-grey-dark dark:text-gray-200">Email Notifications</Text>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#767577', true: '#0A84FF' }}
            />
          </View>
        </View>

        {/* About Section */}
        <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
          <Text className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
            About
          </Text>
          <Text className="text-grey-medium dark:text-gray-400 mb-2">
            PeerCV v3.0.0
          </Text>
          <Text className="text-grey-medium dark:text-gray-400">
            Your verified work history platform
          </Text>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-600 rounded-xl py-4 items-center mt-4"
        >
          <Text className="text-white font-bold text-lg">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
