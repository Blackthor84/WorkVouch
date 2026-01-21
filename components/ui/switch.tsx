'use client'

import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'onChange'> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({ checked, onCheckedChange, disabled, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      {...props}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        checked ? 'bg-blue-600 dark:bg-blue-500' : 'bg-grey-background dark:bg-[#374151]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}
