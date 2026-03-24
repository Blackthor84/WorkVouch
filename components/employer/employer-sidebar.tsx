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
    { href: "/employer/dashboard", label: "Verification Summary", icon: HomeIcon },
    { href: "/employer/verified-workers", label: "Verified workers", icon: UserGroupIcon },
    { href: "/employer/compare", label: "Decision Comparison", icon: MagnifyingGlassIcon },
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
      href: "/employer/candidates",
      label: "Saved Profiles",
      icon: UserGroupIcon,
    },
    {
      href: "/employer/dashboard",
      label: "Hiring Confidence Insights",
      icon: HomeIcon,
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
    <aside className="w-64 min-h-screen border-r border-blue-200/80 bg-blue-50 p-4">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-blue-900">
          Employer Panel
        </h2>
      </div>
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <ListItem key={item.label} href={item.href} active={isActive}>
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </ListItem>
          );
        })}
      </nav>
    </aside>
  );
}
