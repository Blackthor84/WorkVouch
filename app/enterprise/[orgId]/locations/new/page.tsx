import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { CreateLocationForm } from "./CreateLocationForm";

export const dynamic = "force-dynamic";

export default async function NewLocationPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireEnterpriseOwner(orgId);
  const supabase = getSupabaseServer();
  const { data: org } = await supabase.from("organizations").select("id, name, slug").eq("id", orgId).single();
  if (!org) notFound();

  return (
    <div className="max-w-md mx-auto">
      <Link href={`/enterprise/${orgId}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
        ← {org.name}
      </Link>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Add location</h1>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Create a new sub-account under {org.name}.</p>
      <CreateLocationForm orgId={orgId} />
    </div>
  );
}
