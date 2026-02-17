import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Check your email
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          We sent you a confirmation link. Click it to verify your email and finish signing up.
        </p>
        <Link
          href="/login"
          className="inline-block text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Back to log in
        </Link>
      </div>
    </div>
  );
}
