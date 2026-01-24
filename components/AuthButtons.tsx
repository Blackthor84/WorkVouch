import Link from 'next/link';

export default function AuthButtons() {
  return (
    <div className="flex gap-4">
      <Link
        href="/auth/signin"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Sign In
      </Link>
      <Link
        href="/auth/signup"
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        Sign Up
      </Link>
    </div>
  );
}
