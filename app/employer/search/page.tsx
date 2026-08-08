import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy route: redirect to canonical employer search. */
export default function EmployerSearchRedirectPage() {
  redirect("/employer/search-users");
}
