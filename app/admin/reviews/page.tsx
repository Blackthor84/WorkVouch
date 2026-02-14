import { getAdminFromMetadata } from "@/lib/auth/admin-from-metadata";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const { isAdmin } = await getAdminFromMetadata();
  if (!isAdmin) {
    return <div className="p-8 text-slate-700">Not authorized</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Moderation</h1>
      <p className="text-sm text-slate-600 mb-4">Review and moderate content.</p>
      <ul className="list-disc ml-6 space-y-1">
        <li><Link href="/admin/verifications" className="text-blue-600 hover:underline">Verification requests</Link></li>
        <li><Link href="/admin/disputes" className="text-blue-600 hover:underline">Disputes</Link></li>
      </ul>
      <Link href="/admin" className="inline-block mt-4 text-sm text-slate-600 hover:underline">← Back to Admin</Link>
    </div>
  );
}
