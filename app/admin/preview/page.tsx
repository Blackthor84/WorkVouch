import { redirect } from 'next/navigation';
import { getSupabaseSession } from "@/lib/supabase/server";
import AdminPreview from '@/components/AdminPreview';

export default async function AdminPreviewPage() {
  const { session } = await getSupabaseSession();

  if (!session?.user) redirect('/login');
  const roles = session.user.roles || [];
  if (!roles.includes('admin') && !roles.includes('superadmin')) redirect('/dashboard');

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Preview Panel</h1>
      <p className="text-gray-600 mb-6">
        Preview how career pages and onboarding flows appear to employees and employers.
      </p>
      <AdminPreview />
    </div>
  );
}
