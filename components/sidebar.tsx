import Link from "next/link";

type Role = "employee" | "employer" | "admin" | null;

export default function Sidebar({ role }: { role?: Role } = {}) {
  return (
    <div className="w-64 min-h-screen border-r bg-white dark:bg-gray-900 dark:border-gray-800 p-6">
      <h2 className="text-xl font-bold mb-8 text-gray-900 dark:text-white">
        WorkVouch
      </h2>

      <nav className="flex flex-col gap-4">
        <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Dashboard
        </Link>
        <Link href="/jobs" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Verified Jobs
        </Link>
        <Link href="/verifications" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Verifications
        </Link>
        <Link href="/profile" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Profile
        </Link>
        <Link href="/settings" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Settings
        </Link>
      </nav>
    </div>
  );
}
