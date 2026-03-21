import Link from "next/link";
import { SmartGuide } from "@/components/guidance/SmartGuide";

export const dynamic = "force-dynamic";

export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117]">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/enterprise" className="text-lg font-semibold text-gray-900 dark:text-white">
            WorkVouch Enterprise
          </Link>
          <nav className="flex flex-wrap gap-3 sm:gap-4 items-center justify-end">
            <Link href="/enterprise/dashboard" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              Hiring Intelligence
            </Link>
            <Link href="/enterprise/team-risk" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Team risk
            </Link>
            <Link href="/enterprise" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Organizations
            </Link>
            <Link href="/employer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Employer home
            </Link>
            <SmartGuide />
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
