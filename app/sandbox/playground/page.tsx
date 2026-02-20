import { redirect } from "next/navigation";

/** Simulation UI consolidated under Admin Playground. */
export default function SandboxPlaygroundRedirect() {
  redirect("/admin/playground");
}
