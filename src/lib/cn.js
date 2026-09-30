import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Joins class names and resolves Tailwind conflicts (used by the vendored chart components).
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
