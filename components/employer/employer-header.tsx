import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "../sign-out-button";
import { WvBadge, WvButton } from "@/components/wv";
import { Bell } from "lucide-react";

export async function EmployerHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-wv-border bg-wv-surface/80 backdrop-blur-xl px-4 py-3 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-base font-semibold text-wv-foreground md:text-lg">
            {user?.email || "Employer account"}
          </h1>
          <WvBadge variant="brand">Pro Plan</WvBadge>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <WvButton variant="ghost" size="sm" ariaLabel="Notifications">
            <Bell className="h-4 w-4" aria-hidden />
          </WvButton>
          <WvButton href="/employer/billing" variant="secondary" size="sm">
            Upgrade
          </WvButton>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
