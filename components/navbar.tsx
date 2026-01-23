import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="bg-blue-700 text-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center">
          <Image 
            src="/logo.png" 
            alt="WorkVouch Logo" 
            width={120} 
            height={40} 
            className="h-10 w-auto"
            unoptimized
          />
        </Link>
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/" className="hover:text-gray-300 transition">Home</Link>
          <Link href="/about" className="hover:text-gray-300 transition">About</Link>
          <Link href="/pricing" className="hover:text-gray-300 transition">Pricing</Link>
          <Link href="/careers" className="hover:text-gray-300 transition">Careers</Link>
          <Link href="/contact" className="hover:text-gray-300 transition">Contact</Link>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/auth/signin" className="bg-gray-100 text-blue-700 px-4 py-2 rounded hover:bg-gray-200 transition">Login</Link>
        <Link href="/auth/signup" className="bg-white text-blue-700 px-4 py-2 rounded hover:bg-gray-100 transition font-semibold">Sign Up</Link>
      </div>
    </nav>
  );
}
