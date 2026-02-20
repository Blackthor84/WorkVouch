import { redirect } from "next/navigation";

/** Legacy: redirect to unified Playground. */
export default function SandboxRedirect() {
  redirect("/admin/playground");
}
