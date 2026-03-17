"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/AuthProvider";
import { ProfileDropdown } from "@/components/workvouch/ProfileDropdown";
import { supabaseBrowser } from "@/lib/supabase/browser";

const navLinkClass = "text-white/90 hover:text-white transition whitespace-nowrap";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, loading } = useUser();

  const isLoading = loading;
  const isAuthenticated = user !== null;

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="relative z-50">
      <nav className="bg-blue-700 text-white shadow-md h-14 flex items-center px-4 md:px-8">
        <div className="flex flex-1 items-center justify-between gap-4 max-w-7xl mx-auto min-w-0">
          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0 min-w-0">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Image
                src="/images/workvouch-logo.png.png"
                alt="WorkVouch"
                width={300}
                height={100}
                className="h-10 w-auto flex-shrink-0 max-w-[120px]"
                priority
                style={{ objectFit: "contain", width: "auto", height: "40px" }}
              />
              <span className="font-semibold text-white/90 hover:text-white transition hidden sm:inline">
                WorkVouch
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-5 flex-shrink-0">
              <Link href="/" className={navLinkClass}>Home</Link>
              <Link href="/about" className={navLinkClass}>About</Link>
              <Link href="/demo" className={navLinkClass}>Demo</Link>
              <Link href="/pricing" className={navLinkClass}>Pricing</Link>
              <Link href="/careers" className={navLinkClass}>Careers</Link>
              <Link href="/contact" className={navLinkClass}>Contact</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden md:flex items-center gap-4">
              {isLoading && (
                <span className="text-white/90 text-sm">Loading...</span>
              )}
              {!isLoading && !isAuthenticated && (
                <>
                  <Link
                    href="/login"
                    className="text-white/90 hover:text-white border border-white/60 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap hover:bg-white/10"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition whitespace-nowrap"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              {!isLoading && isAuthenticated && (
                <>
                  <Link href="/coworker-matches" className={navLinkClass}>
                    Dashboard
                  </Link>
                  <Link href="/requests" className={navLinkClass}>
                    Requests
                  </Link>
                  <Link href="/notifications" className={navLinkClass}>
                    Notifications
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-white/90 hover:text-white transition whitespace-nowrap font-medium"
                  >
                    Logout
                  </button>
                  <ProfileDropdown />
                </>
              )}
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -m-2 text-white/90 hover:text-white transition rounded-lg"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
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
      </nav>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-blue-700 border-t border-blue-600 py-4 px-4 z-50 space-y-1">
          <Link href="/" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link href="/about" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/demo" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Demo</Link>
          <Link href="/pricing" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
          <Link href="/careers" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Careers</Link>
          <Link href="/contact" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          <div className="pt-3 mt-3 border-t border-white/20 space-y-2">
            {!isLoading && !isAuthenticated && (
              <>
                <Link href="/login" className="block text-center text-white/90 hover:text-white border border-white/60 py-2.5 rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <Link href="/signup" className="block text-center bg-white text-blue-600 py-2.5 rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
              </>
            )}
            {!isLoading && isAuthenticated && (
              <>
                <Link href="/coworker-matches" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link href="/requests" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Requests</Link>
                <Link href="/notifications" className="block py-2.5 text-white/90 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>Notifications</Link>
                <button type="button" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full text-left py-2.5 text-white/90 hover:text-white font-medium">
                  Logout
                </button>
                <div className="pt-2" onClick={() => setMobileMenuOpen(false)}>
                  <ProfileDropdown />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
