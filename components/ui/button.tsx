import { ButtonHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  asChild?: boolean
  href?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  asChild,
  href,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center'
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-400 dark:text-white dark:shadow-[0_0_12px_rgba(59,130,246,0.5)] shadow-md hover:shadow-lg',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-[#111827] dark:text-gray-300 dark:border-[#374151] dark:hover:bg-[#1A1F2B]',
    ghost: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-[#1A1F2B] dark:hover:text-blue-300 rounded-lg',
    danger: 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-400',
  }
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  const classes = cn(baseStyles, variants[variant], sizes[size], className)
  
  // If href is provided, render as Link
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }
  
  return (
    <button
      className={classes}
      {...props}
    >
      {children}
    </button>
  )
}
