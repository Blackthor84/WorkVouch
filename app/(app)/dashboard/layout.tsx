import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    console.log("REDIRECT TRIGGERED IN: app/(app)/dashboard/layout.tsx");
    redirect("/auth/signin");
  }

  return <>{children}</>;
}
