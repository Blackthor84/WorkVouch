import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { signIn } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import Animated, { FadeInDown } from 'react-native-reanimated'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      if (data.session) {
        // Check user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single()

        if ((profile as { role?: string })?.role === 'employer') {
          router.replace('/(employer)/dashboard')
        } else {
          router.replace('/(tabs)/dashboard')
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 px-6 pt-20">
        <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
          <Text className="text-4xl font-bold text-grey-dark mb-2">Welcome Back</Text>
          <Text className="text-lg text-grey-medium">Sign in to your PeerCV account</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} className="space-y-4">
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
              placeholder="Enter your password"
              secureTextEntry
              className="bg-white dark:bg-[#111827] rounded-xl px-4 py-4 text-grey-dark border border-gray-300 dark:border-[#374151]"
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/reset-password')}
            className="self-end"
          >
            <Text className="text-primary font-semibold">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-primary rounded-xl py-4 items-center mt-6"
          >
            <Text className="text-white font-bold text-lg">
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-grey-medium">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-primary font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  )
}
