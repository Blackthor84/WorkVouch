import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0D1117] px-4">
      <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-gray-100">Access denied</h1>
      <p className="mt-2 text-[#64748B] dark:text-gray-400 text-center max-w-md">
        You don&apos;t have permission to view this page.
      </p>
      <Link
        href="/"
        className="mt-6 text-[#2563EB] dark:text-blue-400 hover:underline font-medium"
      >
        Return home
      </Link>
    </div>
  );
}
