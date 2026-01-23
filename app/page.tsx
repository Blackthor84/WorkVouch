import Link from "next/link";

// Ensure this page is statically generated and doesn't require env vars
export const dynamic = "force-static";
export const revalidate = false;

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-6">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">
          Welcome to WorkVouch
        </h1>

        <p className="text-lg text-gray-700 max-w-xl mb-8">
          WorkVouch is your trusted social resume network. Build credibility, get peer references, and show employers your verified work history.
        </p>

        <div className="flex gap-4">
          <Link href="/auth/signup" className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition">
            Get Started
          </Link>
          <Link href="/pricing" className="bg-gray-200 text-gray-900 px-6 py-3 rounded-lg shadow hover:bg-gray-300 transition">
            See Pricing
          </Link>
        </div>
    </main>
  );
}
