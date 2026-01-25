import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import AdsManager from '@/components/AdsManager';

export default async function AdminAdsPage() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/dashboard');
  }
  
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Ad Panel</h1>
      <p className="text-gray-600 mb-4">
        Manage ads that appear on the homepage. Only active ads will be visible to visitors.
      </p>
      <AdsManager />
    </div>
  );
}
