import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import AdminPreview from '@/components/AdminPreview';

export default async function AdminPreviewPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");

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
