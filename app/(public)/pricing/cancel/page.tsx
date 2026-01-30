import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PricingCancel() {
  return (
    <div className="max-w-4xl mx-auto p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">Checkout Cancelled</h1>
      <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">
        Your checkout was cancelled. No charges were made.
      </p>
      <div className="space-x-4">
        <Link href="/pricing">
          <button className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors">
            Return to Pricing
          </button>
        </Link>
        <Link href="/">
          <button className="bg-gray-200 text-gray-800 px-6 py-3 rounded hover:bg-gray-300 transition-colors">
            Go Home
          </button>
        </Link>
      </div>
    </div>
  );
}
