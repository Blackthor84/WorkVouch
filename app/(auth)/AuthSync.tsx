"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AuthSync() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // ✅ hooks ALWAYS run
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    // DO NOT redirect based on role here
    // Server layouts already enforce auth
  }, [mounted, router])

  return null
}
