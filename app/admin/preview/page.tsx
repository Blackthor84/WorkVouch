import { requireAdmin } from "@/lib/admin/requireAdmin";
import AdminPreview from '@/components/AdminPreview';

export default async function AdminPreviewPage() {
  await requireAdmin();

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
