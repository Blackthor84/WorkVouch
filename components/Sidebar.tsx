"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

type Role = "employee" | "employer" | "admin" | null;

const employeeNav = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/my-jobs", label: "Verified Work History", icon: BriefcaseIcon },
  { href: "/upload-resume", label: "Resume", icon: DocumentTextIcon },
  { href: "/coworker-matches", label: "Coworker Verifications", icon: UserGroupIcon },
  { href: "/dashboard/worker", label: "Network", icon: CircleStackIcon },
  { href: "/dashboard/settings", label: "Settings", icon: Cog6ToothIcon },
];

const employerNav = [
  { href: "/dashboard/employer", label: "Dashboard", icon: HomeIcon },
  { href: "/dashboard/employer/search", label: "Search Candidates", icon: MagnifyingGlassIcon },
  { href: "/employer/listed-employees", label: "Verified Work Histories", icon: ClipboardDocumentListIcon },
  { href: "/employer/job-posts", label: "Post Job", icon: BriefcaseIcon },
  { href: "/employer/listed-employees", label: "Invite References", icon: UserPlusIcon },
  { href: "/dashboard/settings", label: "Settings", icon: Cog6ToothIcon },
];

/**
 * Professional scrollable sidebar — Stripe/Notion/Linear style.
 * Left = Navigation. Use "Verified Work History" (not "My Jobs") to reinforce trust product.
 */
export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const isEmployer = role === "employer";
  const links = isEmployer ? employerNav : employeeNav;

  return (
    <aside className="w-64 min-h-screen flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
      <div className="flex h-16 items-center border-b border-gray-200 dark:border-gray-800 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            WorkVouch
          </span>
        </Link>
      </div>
      <nav className="p-4 flex flex-col gap-1">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
