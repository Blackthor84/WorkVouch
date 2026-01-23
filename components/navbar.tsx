import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between p-4 bg-white shadow-md sticky top-0 z-50">
      {/* Logo */}
      <Link href="/">
        <img src="/logo.png" alt="WorkVouch Logo" className="h-10" />
      </Link>

      {/* Navigation Links */}
      <ul className="flex gap-6">
        <li>
          <Link href="/pricing" className="hover:text-blue-600">
            Pricing
          </Link>
        </li>
        <li>
          <Link href="/auth/signin" className="hover:text-blue-600">
            Sign In
          </Link>
        </li>
        <li>
          <Link href="/auth/signup" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Sign Up
          </Link>
        </li>
      </ul>
    </nav>
  );
}
