import { requireAdmin } from "@/lib/admin/requireAdmin";
import Link from 'next/link';

export default async function AdCancelPage() {
  await requireAdmin();

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="border rounded-lg p-8 bg-yellow-50 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold mb-4 text-yellow-800">Payment Cancelled</h1>
        <p className="text-gray-700 mb-6">
          Your ad purchase was cancelled. No charges were made.
        </p>
        <div className="space-y-3">
          <Link
            href="/admin/ads"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Back to Ads
          </Link>
        </div>
      </div>
    </div>
  );
}
