import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-blue-700 text-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <img src="/logo.png" alt="WorkVouch Logo" className="h-10 w-auto" />
        </Link>
        <Link href="/" className="hover:text-gray-300">Home</Link>
        <Link href="/about" className="hover:text-gray-300">About</Link>
        <Link href="/pricing" className="hover:text-gray-300">Pricing</Link>
        <Link href="/careers" className="hover:text-gray-300">Careers</Link>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/auth/signin" className="bg-gray-100 text-blue-700 px-4 py-2 rounded hover:bg-gray-200">Sign In</Link>
        <Link href="/auth/signup" className="bg-gray-100 text-blue-700 px-4 py-2 rounded hover:bg-gray-200">Sign Up</Link>
      </div>
    </nav>
  );
}
