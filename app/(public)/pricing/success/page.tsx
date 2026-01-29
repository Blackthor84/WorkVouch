import Link from "next/link";

export default async function PricingSuccess(props: any) {
  const searchParams = await props.searchParams;
  const session_id = searchParams?.session_id;

  return (
    <div className="max-w-4xl mx-auto p-6 text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>
      <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
      <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">
        Your subscription has been activated. You now have access to all premium features.
      </p>
      {session_id && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          Session ID: {session_id}
        </p>
      )}
      <div className="space-x-4">
        <Link href="/dashboard">
          <button className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors">
            Go to Dashboard
          </button>
        </Link>
        <Link href="/pricing">
          <button className="bg-gray-200 text-gray-800 px-6 py-3 rounded hover:bg-gray-300 transition-colors">
            View Plans
          </button>
        </Link>
      </div>
    </div>
  );
}
