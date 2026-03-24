import Link from "next/link";

type Role = "employee" | "employer" | "admin" | null;

export default function Sidebar({ role }: { role?: Role } = {}) {
  return (
    <div className="w-64 min-h-screen border-r border-blue-200/80 bg-blue-50 p-6">
      <h2 className="mb-8 text-xl font-bold text-blue-900">
        WorkVouch
      </h2>

      <nav className="flex flex-col gap-1">
        <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100">
          Dashboard
        </Link>
        <Link href="/jobs" className="rounded-lg px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100">
          Verified Jobs
        </Link>
        <Link href="/verifications" className="rounded-lg px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100">
          Verifications
        </Link>
        <Link href="/profile" className="rounded-lg px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100">
          Profile
        </Link>
        <Link href="/settings" className="rounded-lg px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100">
          Settings
        </Link>
      </nav>
    </div>
  );
}
