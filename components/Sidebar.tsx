import Link from "next/link";

type Role = "employee" | "employer" | "admin" | null;

export default function Sidebar({ role }: { role?: Role } = {}) {
  return (
    <div className="w-64 min-h-screen border-r bg-white p-6">

      <h2 className="text-xl font-bold mb-8">
        WorkVouch
      </h2>

      <nav className="flex flex-col gap-4">

        <Link href="/dashboard">Dashboard</Link>

        <Link href="/jobs">Verified Jobs</Link>

        <Link href="/verifications">Verifications</Link>

        <Link href="/profile">Profile</Link>

        <Link href="/settings">Settings</Link>

      </nav>

    </div>
  );
}
