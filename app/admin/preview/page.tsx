import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import AdminPreview from '@/components/AdminPreview';

export default async function AdminPreviewPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    console.log("REDIRECT TRIGGERED IN: app/admin/preview/page.tsx");
    redirect('/auth/signin');
  }

  const isAdmin = session.user.role === 'admin' || session.user.roles?.includes('admin') || session.user.roles?.includes('superadmin');

  if (!isAdmin) {
    console.log("REDIRECT TRIGGERED IN: app/admin/preview/page.tsx (isAdmin check)");
    redirect('/auth/signin');
  }

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
