import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminAbusePage() {
  redirect("/admin/scale-metrics");
}
