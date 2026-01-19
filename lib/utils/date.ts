/**
 * Simple date formatting utilities (no external dependencies)
 */

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  
  return d.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  })
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, 'short')
}

export function formatDateLong(date: string | Date): string {
  return formatDate(date, 'long')
}
