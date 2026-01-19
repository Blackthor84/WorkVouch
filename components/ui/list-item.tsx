import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ListItemProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
  active?: boolean
}

export function ListItem({ children, href, onClick, className, active }: ListItemProps) {
  const baseClasses = 'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer'
  const activeClasses = active
    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
    : 'text-grey-dark dark:text-gray-200 hover:bg-grey-background dark:hover:bg-[#1A1F2B]'

  const content = (
    <div className={cn(baseClasses, activeClasses, className)} onClick={onClick}>
      {children}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
