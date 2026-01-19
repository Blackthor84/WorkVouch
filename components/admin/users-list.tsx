'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

export function AdminUsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, created_at')
          .order('created_at', { ascending: false })

        if (error) throw error
        setUsers(data || [])
      } catch (error: any) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [supabase])

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading users...</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {users.map((user) => (
        <Card key={user.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-grey-dark dark:text-gray-200">
                {user.full_name || 'No name'}
              </p>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                {user.email}
              </p>
              <p className="text-xs text-grey-medium dark:text-gray-500 mt-1">
                Role: <span className="font-medium">{user.role || 'user'}</span>
              </p>
            </div>
            <div className="text-xs text-grey-medium dark:text-gray-500">
              {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
        </Card>
      ))}

      {users.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-grey-medium dark:text-gray-400">No users found</p>
        </Card>
      )}
    </div>
  )
}
