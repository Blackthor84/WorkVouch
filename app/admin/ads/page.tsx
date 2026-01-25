import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import AdminAdsPanel from '@/components/AdminAdsPanel';

export default async function AdminAdsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  const isAdmin = session.user.role === 'admin' || session.user.roles?.includes('admin') || session.user.roles?.includes('superadmin');
  
  if (!isAdmin) {
    redirect('/auth/signin');
  }
  
  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <AdminAdsPanel />
    </div>
  );
}
