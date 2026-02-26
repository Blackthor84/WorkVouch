"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthContextProvider } from "@/components/AuthContext"

type LayoutUser = {
  id: string
  role: string
} | null

export default function AdminClientLayout({
  user,
  children,
}: {
  user: LayoutUser
  children: React.ReactNode
}) {
  const router = useRouter()

  // ✅ hooks ALWAYS declared
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // server already enforced auth — this is just safety
    if (!user) {
      router.replace("/login")
      return
    }
    setReady(true)
  }, [user, router])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Loading admin…
      </div>
    )
  }

  return (
    <AuthContextProvider role={user.role} loading={false}>
      {children}
    </AuthContextProvider>
  )
}
