"use client";

import { usePathname } from "next/navigation";
import { ListItem } from "../ui/list-item";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

export function EmployerSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/employer/dashboard", label: "Dashboard", icon: HomeIcon },
    { href: "/employer/claim", label: "Claim company", icon: BuildingOfficeIcon },
    {
      href: "/employer/directory",
      label: "Directory",
      icon: UserGroupIcon,
    },
    {
      href: "/employer/candidates",
      label: "Candidates",
      icon: MagnifyingGlassIcon,
    },
    {
      href: "/employer/messages",
      label: "Messages",
      icon: ChatBubbleLeftRightIcon,
    },
    { href: "/employer/billing", label: "Billing", icon: CreditCardIcon },
    { href: "/employer/settings", label: "Settings", icon: Cog6ToothIcon },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-[#111827] border-r border-grey-background dark:border-[#374151] min-h-screen p-4">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-grey-dark dark:text-gray-200">
          Employer Panel
        </h2>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <ListItem key={item.href} href={item.href} active={isActive}>
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </ListItem>
          );
        })}
      </nav>
    </aside>
  );
}
