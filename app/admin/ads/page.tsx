import { requireAdmin } from "@/lib/auth/requireAdmin";
import AdminAdsPanel from "@/components/AdminAdsPanel";
import { AdminAdsGate } from "@/components/AdminAdsGate";
import { AD_PRICING } from "@/lib/ads/pricing";
import Link from "next/link";

export default async function AdminAdsPage() {
  await requireAdmin();

  return (
    <AdminAdsGate>
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Advertising Dashboard (Admin Only)</h1>
        <p className="text-gray-600 mb-4">
          These ads are hidden from all normal users. Only active ads approved by admins will be visible to workers.
        </p>
        <div className="flex gap-4 mb-6">
          <Link
            href="/admin/ads/preview"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Preview Homepage Ads
          </Link>
        </div>
      </div>

      {/* Ad Pricing Cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Available Ad Packages</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AD_PRICING.map((ad) => (
            <div key={ad.id} className="border rounded-lg p-5 shadow-md hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">{ad.label}</h3>
              <p className="text-2xl font-bold text-blue-600 mb-2">${ad.price}</p>
              <p className="text-gray-700 text-sm mb-1">Duration: {ad.durationDays} days</p>
              <p className="text-gray-600 text-sm mb-4">
                Impressions: {typeof ad.impressions === 'string' ? ad.impressions : ad.impressions.toLocaleString()}
              </p>

              <Link
                href={`/admin/ads/buy/${ad.id}`}
                className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Create Ad
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Legacy Ad Management Panel */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Manage Existing Ads</h2>
        <AdminAdsPanel />
      </div>
    </div>
    </AdminAdsGate>
  );
}
