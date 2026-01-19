'use client'

import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero'
}

export function Logo({ className = '', showText = false, size = 'xl' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-60 w-auto max-w-[840px]', // Navbar size - 3x bigger
    '2xl': 'h-32 w-auto max-w-[400px]', // Large size
    hero: 'h-96 w-auto max-w-[2400px] sm:h-[480px] sm:max-w-[3000px]', // Hero/landing page - 3x bigger, transparent
  }

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  // For larger sizes (xl, 2xl, hero), use width/height to maintain aspect ratio
  if (size === 'xl' || size === '2xl' || size === 'hero') {
    const dimensions = {
      xl: { width: 840, height: 240 }, // Navbar - 3x bigger
      '2xl': { width: 400, height: 120 },
      hero: { width: 3000, height: 900 }, // Landing page - 3x bigger
    }
    
    const dims = dimensions[size]
    
    return (
      <Link href="/" className={`flex items-center ${className}`}>
        <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
          <Image
            src="/logo.png"
            alt="WorkVouch Logo"
            width={dims.width}
            height={dims.height}
            className="h-full w-auto object-contain"
            priority
            style={{ backgroundColor: 'transparent' }}
          />
        </div>
        {showText && (
          <span className={`font-bold ${textSizes['lg']} bg-gradient-to-br from-blue-600 to-green-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-green-400 ml-3`}>
            WorkVouch
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
        <Image
          src="/logo.png"
          alt="WorkVouch Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={`font-bold ${textSizes[size]} bg-gradient-to-br from-blue-600 to-green-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-green-400`}>
          WorkVouch
        </span>
      )}
    </Link>
  )
}
