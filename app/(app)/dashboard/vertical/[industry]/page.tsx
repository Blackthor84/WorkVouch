import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ industry: string }>;
};

/** Legacy vertical dashboard — canonical employee dashboard is /dashboard. */
export default async function VerticalDashboardRedirect({ params }: Props) {
  await params;
  redirect("/dashboard");
}
