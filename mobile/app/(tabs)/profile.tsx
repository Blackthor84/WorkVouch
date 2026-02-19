import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { JobHistoryList } from '@/components/JobHistoryList'
import { PeerReferencesList } from '@/components/PeerReferencesList'

export default function ProfileScreen() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [references, setReferences] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const currentUser = await getCurrentUser()
    if (!currentUser) return

    setUser(currentUser)
    const userProfile = await getUserProfile(currentUser.id)
    setProfile(userProfile)

    // Load jobs
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('start_date', { ascending: false })

    if (jobsData) setJobs(jobsData)

    // Load references
    const { data: refsData } = await supabase
      .from('user_references')
      .select('*, from_user:profiles!references_from_user_id_fkey(full_name, profile_photo_url)')
      .eq('to_user_id', currentUser.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (refsData) setReferences(refsData)
  }

  async function onRefresh() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  async function handleImagePick() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (!permissionResult.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photos')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      // Upload to Supabase Storage
      const file = result.assets[0]
      const fileExt = file.uri.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      // Convert to blob
      const response = await fetch(file.uri)
      const blob = await response.blob()

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, blob)

      if (uploadError) {
        Alert.alert('Error', 'Failed to upload image')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        Alert.alert('Error', 'Failed to update profile')
        return
      }

      await loadData()
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="px-6 pt-12 pb-6">
        {/* Profile Header */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={handleImagePick}>
            {profile?.profile_photo_url ? (
              <Image
                source={{ uri: profile.profile_photo_url }}
                className="w-32 h-32 rounded-full mb-4"
              />
            ) : (
              <View className="w-32 h-32 rounded-full bg-primary-light dark:bg-blue-900/20 items-center justify-center mb-4">
                <Text className="text-4xl font-bold text-primary">
                  {profile?.full_name?.charAt(0) || 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-grey-dark dark:text-gray-200">
            {profile?.full_name || 'User'}
          </Text>
          {profile?.industry && (
            <Text className="text-grey-medium dark:text-gray-400 capitalize mt-1">
              {profile.industry.replace('_', ' ')}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            className="mt-4 bg-primary rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Job History */}
        <JobHistoryList jobs={jobs} />

        {/* Peer References */}
        <PeerReferencesList references={references} />

        {/* Coworker Verification Status */}
        <View className="bg-white dark:bg-[#1A1F2B] rounded-2xl p-6 mb-4 shadow-md">
          <Text className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Verification Status
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-grey-medium dark:text-gray-400">Jobs Verified</Text>
              <Text className="font-semibold text-grey-dark dark:text-gray-200">
                {jobs.filter(j => !j.is_private).length} / {jobs.length}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-grey-medium dark:text-gray-400">Coworker Matches</Text>
              <Text className="font-semibold text-grey-dark dark:text-gray-200">
                {jobs.reduce((acc, job) => acc + (job.coworker_matches?.length || 0), 0)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
