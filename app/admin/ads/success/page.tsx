import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import Link from 'next/link';

export default async function AdSuccessPage() {
  const ctx = await getAdminContext();
  if (!ctx.authorized) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="border rounded-lg p-8 bg-green-50 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold mb-4 text-green-800">Payment Successful!</h1>
        <p className="text-gray-700 mb-6">
          Your ad purchase has been processed successfully. The ad will be activated shortly.
        </p>
        <div className="space-y-3">
          <Link
            href="/admin/ads"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Manage Ads
          </Link>
          <Link
            href="/admin/ads/preview"
            className="inline-block ml-3 px-6 py-3 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            Preview Ads
          </Link>
        </div>
      </div>
    </div>
  );
}
