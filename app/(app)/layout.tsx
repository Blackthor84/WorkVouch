import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117]">
      {children}
    </div>
  );
}
