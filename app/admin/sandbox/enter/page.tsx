import { redirect } from "next/navigation";

/** Legacy: simulation is now under Playground. */
export default function EnterSandboxPage() {
  redirect("/admin/playground");
}
