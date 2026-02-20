import { redirect } from "next/navigation";

/** Legacy: simulation UI consolidated under Playground. Use /admin/playground. */
export default function AdminSandboxV2Page() {
  redirect("/admin/playground");
}
