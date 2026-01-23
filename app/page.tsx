import Link from "next/link";

// Ensure this page is statically generated and doesn't require env vars
export const dynamic = "force-static";
export const revalidate = false;

export default function Home() {
  return (
    <div className="text-center py-20 px-4 max-w-4xl mx-auto">
      <h1 className="text-5xl font-bold text-blue-800 mb-6">
        Welcome to WorkVouch
      </h1>
      <p className="text-gray-700 text-lg mb-8">
        WorkVouch is your trusted platform to verify work history, connect with employers, and build a credible reputation online.
      </p>
      <div className="space-x-4">
        <Link href="/auth/signup" className="bg-blue-700 text-white px-6 py-3 rounded hover:bg-blue-800">
          Get Started
        </Link>
        <Link href="/about" className="bg-gray-200 text-gray-800 px-6 py-3 rounded hover:bg-gray-300">
          Learn More
        </Link>
      </div>
    </div>
  );
}
