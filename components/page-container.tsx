import { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

/**
 * PageContainer - Ensures consistent vertical spacing across all pages
 * Uses space-y-12 md:space-y-16 lg:space-y-20 for even spacing between sections
 */
export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main className={`flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16 ${className}`}>
      <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20">
        {children}
      </div>
    </main>
  )
}
