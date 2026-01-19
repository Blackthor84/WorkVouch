import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WorkVouch - Trust-Based Professional Profiles',
  description: 'Build your professional reputation through verified peer references. Trusted by security, law enforcement & professionals.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background dark:bg-[#0D1117] antialiased transition-colors">{children}</body>
    </html>
  )
}

