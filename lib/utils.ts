import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(dateInput: string | number | Date): string {
  const date = new Date(dateInput)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.34524, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ]

  let unit = 'second'
  let count = seconds
  let i = 0
  let divisor = 1

  while (i < intervals.length && count >= intervals[i][0]) {
    divisor *= intervals[i][0]
    count = Math.floor(seconds / divisor)
    unit = intervals[i][1]
    i++
  }

  if (count <= 1) {
    switch (unit) {
      case 'second': return 'just now'
      case 'minute': return '1 minute ago'
      case 'hour': return '1 hour ago'
      case 'day': return 'yesterday'
      default: return `1 ${unit} ago`
    }
  }

  return `${count} ${unit}${count !== 1 ? 's' : ''} ago`
}
