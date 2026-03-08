import { createClient } from "@/lib/supabase/server";

/**
 * Profile page. Authentication is enforced by (app)/layout.tsx — no redirect logic here.
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <p>Email: {user?.email}</p>
      <p>User ID: {user?.id}</p>
    </div>
  );
}
