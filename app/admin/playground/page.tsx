import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import PlaygroundClient from "./PlaygroundClient";

export const dynamic = "force-dynamic";

/** In-memory Admin Playground: scenario outcomes, timeline, employer/candidate view, export, shareable URL. No DB. */
export default async function AdminPlaygroundPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/dashboard");

  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading Playground…</div>}>
      <PlaygroundClient />
    </Suspense>
  );
}
