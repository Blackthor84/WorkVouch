"use client"

import { useSearchParams } from "next/navigation"

export default function UpgradeClient() {
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan")

  return (
    <div>
      <h1>Upgrade</h1>
      {plan && <p>Selected plan: {plan}</p>}
    </div>
  )
}
