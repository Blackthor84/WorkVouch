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
  roles: string[];
}

export function Sidebar({ roles }: SidebarProps) {
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

  if (roles.includes("employer")) {
    navigation.push({
      name: "Search",
      href: "/employer/search",
      icon: MagnifyingGlassIcon,
    });
  }

  if (roles.includes("admin")) {
    navigation.push({
      name: "Admin",
      href: "/admin",
      icon: ShieldCheckIcon,
    });
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-[#E2E8F0] shadow-sm">
      <div className="flex h-16 items-center border-b border-[#E2E8F0] px-6">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold text-[#0F172A]">
            WorkVouch
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#2563EB] text-white shadow-md"
                  : "text-[#334155] font-medium hover:bg-blue-50 hover:text-[#2563EB]",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive
                    ? "text-white"
                    : "text-[#64748B] group-hover:text-[#2563EB]",
                  "group-hover:scale-110",
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
