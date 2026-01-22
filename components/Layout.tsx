import React from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full">
        <nav className="px-4" style={{ paddingTop: '0.5in', paddingBottom: '0.5in' }}>
          {/* Navbar content */}
        </nav>
      </header>

      <main className="flex-1 flex flex-col" style={{ gap: '2in' }}>
        {children}
      </main>

      <footer className="w-full px-4 py-6 md:py-8 lg:py-12 text-center text-gray-600">
        © 2026 WorkVouch. All rights reserved.
      </footer>
    </div>
  )
}
