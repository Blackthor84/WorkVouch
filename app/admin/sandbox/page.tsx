import { redirect } from "next/navigation";

export default function SandboxRedirect() {
  redirect("/admin/sandbox-v2");
}
