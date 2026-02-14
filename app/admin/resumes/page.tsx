import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import Link from "next/link";
import { ResumesListAdmin } from "./ResumesListAdmin";

export const dynamic = "force-dynamic";

export default async function AdminResumesPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold mb-2">Resumes (admin)</h1>
      <p className="text-sm text-slate-600 mb-6">
        List resumes by user or organization. Inspect parsed data and status.
      </p>
      <ResumesListAdmin />
      <div className="mt-6">
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">
          ← Back to Admin
        </Link>
      </div>
    </div>
  );
}
