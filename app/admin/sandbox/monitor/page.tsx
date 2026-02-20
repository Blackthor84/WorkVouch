import { redirect } from "next/navigation";

/** Legacy: Activity Monitor lives under Playground. */
export default function SandboxMonitorRedirect() {
  redirect("/admin/playground/monitor");
}
