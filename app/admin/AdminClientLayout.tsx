"use client"

import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const { status } = useSupabaseSession()

  // Wait for client session to finish loading before redirecting
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
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
