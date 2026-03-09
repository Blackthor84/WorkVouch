import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Profile page. Authentication is enforced by (app)/layout.tsx — redirect if no user.
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <p>Email: {user.email}</p>
      <p>User ID: {user.id}</p>
    </div>
  );
}
