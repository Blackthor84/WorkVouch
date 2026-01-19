import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { signUp } from '@/lib/auth'
import Animated, { FadeInDown } from 'react-native-reanimated'

export default function RegisterScreen() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await signUp(email, password, {
        full_name: fullName,
      })
      
      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      if (data.user) {
        // Navigate to industry selection
        router.push({
          pathname: '/(auth)/industry-selection',
          params: { userId: data.user.id },
        })
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 px-6 pt-20">
        <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
          <Text className="text-4xl font-bold text-grey-dark mb-2">Create Account</Text>
          <Text className="text-lg text-grey-medium">Join PeerCV and build your verified profile</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} className="space-y-4">
          <View>
            <Text className="text-sm font-semibold text-grey-dark mb-2">Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              className="bg-white dark:bg-[#111827] rounded-xl px-4 py-4 text-grey-dark border border-gray-300 dark:border-[#374151]"
            />
          </View>

          <View>
            <Text className="text-sm font-semibold text-grey-dark mb-2">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-white dark:bg-[#111827] rounded-xl px-4 py-4 text-grey-dark border border-gray-300 dark:border-[#374151]"
            />
          </View>

          <View>
            <Text className="text-sm font-semibold text-grey-dark mb-2">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
              className="bg-white dark:bg-[#111827] rounded-xl px-4 py-4 text-grey-dark border border-gray-300 dark:border-[#374151]"
            />
          </View>

          <View>
            <Text className="text-sm font-semibold text-grey-dark mb-2">Confirm Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              className="bg-white dark:bg-[#111827] rounded-xl px-4 py-4 text-grey-dark border border-gray-300 dark:border-[#374151]"
            />
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className="bg-primary rounded-xl py-4 items-center mt-6"
          >
            <Text className="text-white font-bold text-lg">
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6 mb-8">
            <Text className="text-grey-medium">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
