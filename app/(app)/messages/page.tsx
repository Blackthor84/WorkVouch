import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UserMessages } from "@/components/messages/user-messages";

// Ensure runtime rendering - prevents build-time prerendering
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    console.log("REDIRECT TRIGGERED IN: app/(app)/messages/page.tsx");
    redirect("/login");
  }

  return (
    <div className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16 bg-background dark:bg-[#0D1117]">
      <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
            Messages
          </h1>
          <p className="text-grey-medium dark:text-gray-400 mt-1">
            Your conversations and notifications
          </p>
        </div>
        {/* Messages Content */}
        <div>
          <UserMessages />
        </div>
      </div>
    </div>
  );
}
