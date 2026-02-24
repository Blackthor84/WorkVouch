import { Suspense } from "react"
import UpgradeClient from "./UpgradeClient"

export default function UpgradePage() {
  return (
    <Suspense fallback={<div>Loading upgrade…</div>}>
      <UpgradeClient />
    </Suspense>
  )
}
