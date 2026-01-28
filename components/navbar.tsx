'use client';
import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-blue-700 text-white shadow-md py-4 px-4 md:px-8">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-6 flex-shrink-0 min-w-0">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image 
              src="/workvouch-logo.png" 
              alt="WorkVouch Logo" 
              width={300} 
              height={100} 
              className="h-10 w-auto flex-shrink-0 max-w-[120px]"
              priority
              style={{ objectFit: "contain", width: "auto", height: "40px" }}
            />
          </Link>
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            <Link href="/" className="hover:text-gray-300 transition">Home</Link>
            <Link href="/about" className="hover:text-gray-300 transition">About</Link>
            <Link href="/pricing" className="hover:text-gray-300 transition">Pricing</Link>
            <Link href="/careers" className="hover:text-gray-300 transition">Careers</Link>
            <Link href="/contact" className="hover:text-gray-300 transition">Contact</Link>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/auth/signin" className="bg-gray-100 text-blue-700 px-4 py-2 rounded hover:bg-gray-200 transition">Login</Link>
          <Link href="/auth/signup" className="bg-white text-blue-700 px-4 py-2 rounded hover:bg-gray-100 transition font-semibold">Sign Up</Link>
        </div>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white hover:text-gray-300"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 space-y-2 border-t pt-4">
          <Link href="/" className="block py-2 hover:text-gray-300 transition">Home</Link>
          <Link href="/about" className="block py-2 hover:text-gray-300 transition">About</Link>
          <Link href="/pricing" className="block py-2 hover:text-gray-300 transition">Pricing</Link>
          <Link href="/careers" className="block py-2 hover:text-gray-300 transition">Careers</Link>
          <Link href="/contact" className="block py-2 hover:text-gray-300 transition">Contact</Link>
          <div className="pt-2 space-y-2">
            <Link href="/auth/signin" className="block bg-gray-100 text-blue-700 px-4 py-2 rounded hover:bg-gray-200 transition text-center">Login</Link>
            <Link href="/auth/signup" className="block bg-white text-blue-700 px-4 py-2 rounded hover:bg-gray-100 transition font-semibold text-center">Sign Up</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
