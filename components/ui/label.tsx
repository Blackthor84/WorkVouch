import { LabelHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode
}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('block text-sm font-medium text-grey-dark dark:text-gray-200 mb-1', className)}
      {...props}
    >
      {children}
    </label>
  )
}
