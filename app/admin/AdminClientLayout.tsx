"use client"

import { AuthContextProvider } from "@/components/AuthContext"
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession"

type LayoutUser = {
  id: string
  role: string
  isFounder?: boolean
} | null

export default function AdminClientLayout({
  user,
  children,
}: {
  user: LayoutUser
  children: React.ReactNode
}) {
  const { status } = useSupabaseSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wv-bg text-wv-muted">
        Loading admin…
      </div>
    )
  }

  if (status === "unauthenticated") {
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    return null
  }

  return (
    <AuthContextProvider
      role={user?.role}
      loading={!user}
      isFounder={user?.isFounder ?? false}
    >
      {children}
    </AuthContextProvider>
  )
}
