"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role?: string | null;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Job History", href: "/profile", icon: BriefcaseIcon },
    {
      name: "Connections",
      href: "/coworker-matches",
      icon: UserGroupIcon,
    },
    { name: "References", href: "/references/request", icon: DocumentTextIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ];

  if (role === "employer") {
    navigation.push({
      name: "Search",
      href: "/employer/search",
      icon: MagnifyingGlassIcon,
    });
  }

  if (role === "admin" || role === "superadmin") {
    navigation.push({
      name: "Admin",
      href: "/admin",
      icon: ShieldCheckIcon,
    });
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-blue-200/80 bg-blue-50 shadow-sm">
      <div className="flex h-16 items-center border-b border-blue-200/80 px-5">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold text-blue-900">
            WorkVouch
          </span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                  : "text-blue-800 hover:bg-blue-100",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive
                    ? "text-white"
                    : "text-blue-600 group-hover:text-blue-700",
                  "group-hover:scale-[1.02]",
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
