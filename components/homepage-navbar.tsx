"use client";

import Link from "next/link";
import Image from "next/image";

export function HomepageNavbar() {
  return (
    <nav className="container mx-auto px-4 py-4 md:py-6 lg:py-8 flex justify-between items-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex items-center space-x-2">
        <Link href="/" className="flex items-center m-0 p-0">
          <div className="relative h-40 w-auto max-w-[560px] m-0 p-0">
            <Image
              src="/images/workvouch.png"
              alt="WorkVouch Logo"
              width={200}
              height={50}
              className="h-full w-auto object-contain m-0 p-0 mix-blend-multiply dark:mix-blend-screen"
              style={{
                backgroundColor: "transparent",
                margin: 0,
                padding: 0,
                filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))",
              }}
              priority
            />
          </div>
        </Link>
      </div>
      <div className="hidden md:flex items-center space-x-6">
        <Link
          href="/pricing"
          className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
        >
          Pricing
        </Link>
        <Link
          href="/auth/signin"
          className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
        >
          Login
        </Link>
        <Link
          href="/auth/signup"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
        >
          Sign Up
        </Link>
      </div>
      {/* Mobile Menu Button */}
      <div className="md:hidden flex items-center space-x-4">
        <Link
          href="/auth/signin"
          className="text-gray-700 hover:text-blue-600 transition-colors"
        >
          Login
        </Link>
        <Link
          href="/auth/signup"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
