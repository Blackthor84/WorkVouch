import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/login")
  }

  const user = data.user

  return (
    <div>
      <h1>Profile</h1>
      <p>Email: {user.email}</p>
      <p>User ID: {user.id}</p>
    </div>
  )
}
