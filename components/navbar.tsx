'use client';
import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative">
    <nav className="bg-blue-700 text-white shadow-md h-14 flex items-center px-4 md:px-8">
      <div className="flex flex-1 items-center justify-between gap-4 max-w-7xl mx-auto min-w-0">
        <div className="flex items-center gap-4 md:gap-6 flex-shrink-0 min-w-0">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/images/workvouch-logo.png.png"
              alt="WorkVouch Logo"
              width={300}
              height={100}
              className="h-10 w-auto flex-shrink-0 max-w-[120px]"
              priority
              style={{ objectFit: "contain", width: "auto", height: "40px" }}
            />
          </Link>
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <Link href="/" className="hover:text-gray-300 transition whitespace-nowrap">Home</Link>
            <Link href="/about" className="hover:text-gray-300 transition whitespace-nowrap">About</Link>
            <Link href="/demo" className="hover:text-gray-300 transition whitespace-nowrap">Demo</Link>
            <Link href="/pricing" className="hover:text-gray-300 transition whitespace-nowrap">Pricing</Link>
            <Link href="/careers" className="hover:text-gray-300 transition whitespace-nowrap">Careers</Link>
            <Link href="/contact" className="hover:text-gray-300 transition whitespace-nowrap">Contact</Link>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className="text-white border border-white/80 px-4 py-2 rounded hover:bg-white/20 transition whitespace-nowrap">Login</Link>
            <Link href="/signup" className="text-white border border-white/80 px-4 py-2 rounded hover:bg-white/20 transition font-semibold whitespace-nowrap">Sign Up</Link>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white hover:text-gray-300 p-1"
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
      </div>
      {/* Mobile Menu (dropdown below navbar, not in flow) */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-blue-700 border-t border-blue-600 space-y-2 py-4 px-4 z-50">
          <Link href="/" className="block py-2 hover:text-gray-300 transition">Home</Link>
          <Link href="/about" className="block py-2 hover:text-gray-300 transition">About</Link>
          <Link href="/demo" className="block py-2 hover:text-gray-300 transition">Demo</Link>
          <Link href="/pricing" className="block py-2 hover:text-gray-300 transition">Pricing</Link>
          <Link href="/careers" className="block py-2 hover:text-gray-300 transition">Careers</Link>
          <Link href="/contact" className="block py-2 hover:text-gray-300 transition">Contact</Link>
          <div className="pt-2 space-y-2">
            <Link href="/login" className="block text-white border border-white/80 px-4 py-2 rounded hover:bg-white/20 transition text-center">Login</Link>
            <Link href="/signup" className="block text-white border border-white/80 px-4 py-2 rounded hover:bg-white/20 transition font-semibold text-center">Sign Up</Link>
          </div>
        </div>
      )}
    </nav>
    </header>
  );
}
