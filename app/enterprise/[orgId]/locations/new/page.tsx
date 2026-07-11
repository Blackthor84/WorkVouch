import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { CreateLocationForm } from "./CreateLocationForm";
import { WvPageHeader } from "@/components/wv";

export const dynamic = "force-dynamic";

export default async function NewLocationPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireEnterpriseOwner(orgId);
  const supabase = getSupabaseServer();
  const { data: org } = await supabase.from("organizations").select("id, name, slug").eq("id", orgId).single();
  if (!org) notFound();

  return (
    <div className="max-w-md mx-auto">
      <Link
        href={`/enterprise/${orgId}`}
        className="text-sm text-blue-400 hover:text-blue-300 hover:underline mb-4 inline-block"
      >
        ← {org.name}
      </Link>
      <WvPageHeader
        title="Add location"
        description={`Create a new sub-account under ${org.name}.`}
      />
      <CreateLocationForm orgId={orgId} />
    </div>
  );
}
