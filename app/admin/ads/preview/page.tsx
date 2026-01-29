import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import Link from 'next/link';

export default async function AdPreviewPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    console.log("REDIRECT TRIGGERED IN: app/admin/ads/preview/page.tsx");
    redirect('/auth/signin');
  }

  const isAdmin = session.user.role === 'admin' || session.user.roles?.includes('admin') || session.user.roles?.includes('superadmin');
  
  if (!isAdmin) {
    console.log("REDIRECT TRIGGERED IN: app/admin/ads/preview/page.tsx (isAdmin check)");
    redirect('/auth/signin');
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Homepage Ad Preview</h1>
        <p className="text-gray-600">
          This is how ads will appear to workers. All ads are hidden from normal users until activated by an admin.
        </p>
      </div>

      <div className="space-y-6">
        {/* Homepage Hero Example */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="font-semibold text-lg mb-3">Homepage Hero Banner</h2>
          <div className="h-40 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center rounded-lg shadow-md">
            <span className="text-white text-xl font-semibold">Hero Banner Ad Placeholder</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This ad appears at the top of the homepage and receives maximum visibility.
          </p>
        </div>

        {/* Career Category Example */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="font-semibold text-lg mb-3">Career Category Banner</h2>
          <div className="h-32 bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center rounded-lg shadow-md">
            <span className="text-white text-lg font-semibold">Career Banner Ad Placeholder</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This ad appears on specific career category pages (e.g., Healthcare, Security).
          </p>
        </div>

        {/* Featured Job Example */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="font-semibold text-lg mb-3">Featured Job Ad</h2>
          <div className="h-24 bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center rounded-lg shadow-md">
            <span className="text-white font-semibold">Featured Job Ad Placeholder</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This ad highlights a specific job posting and appears in search results.
          </p>
        </div>

        {/* City Targeted Example */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="font-semibold text-lg mb-3">City Targeted Ad</h2>
          <div className="h-28 bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center rounded-lg shadow-md">
            <span className="text-white font-semibold">City Targeted Ad Placeholder</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This ad appears to users in specific cities or regions.
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/admin/ads"
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Manage Ads
        </Link>
        <Link
          href="/admin"
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
        >
          Back to Admin
        </Link>
      </div>
    </div>
  );
}
