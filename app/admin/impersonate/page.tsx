import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminImpersonatePage() {
  redirect("/superadmin/impersonate");
}
