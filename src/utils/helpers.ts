import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ScoreTier } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`
    if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
    return `₹${amount.toFixed(0)}`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Invalid date'

  if (format === 'relative') {
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / 86_400_000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    if (days < 365) return `${Math.floor(days / 30)}mo ago`
    return `${Math.floor(days / 365)}y ago`
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

export function getScoreTier(score: number): ScoreTier {
  if (score >= 750) return 'Excellent'
  if (score >= 700) return 'Very Good'
  if (score >= 650) return 'Good'
  if (score >= 550) return 'Fair'
  return 'Poor'
}

export function getScoreColor(score: number): string {
  if (score >= 750) return '#10B981'   // success green
  if (score >= 700) return '#3B82F6'   // primary blue
  if (score >= 650) return '#F59E0B'   // warning yellow
  if (score >= 550) return '#F97316'   // orange
  return '#EF4444'                      // danger red
}

export function getScoreGradient(score: number): string {
  if (score >= 750) return 'from-green-500 to-emerald-600'
  if (score >= 700) return 'from-blue-500 to-blue-700'
  if (score >= 650) return 'from-yellow-400 to-orange-500'
  if (score >= 550) return 'from-orange-400 to-orange-600'
  return 'from-red-400 to-red-600'
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'low': return '#10B981'
    case 'medium': return '#F59E0B'
    case 'high': return '#F97316'
    case 'critical': return '#EF4444'
    default: return '#6B7280'
  }
}

export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`
  if (d.length === 12 && d.startsWith('91')) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`
  return phone
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// Animated count-up for number displays
export function easeOutQuad(t: number): number {
  return t * (2 - t)
}

// Generate category colors for pie chart
export const CATEGORY_COLORS: Record<string, string> = {
  gig_income: '#10B981',
  salary: '#3B82F6',
  food: '#F59E0B',
  rent: '#8B5CF6',
  electricity: '#F97316',
  mobile_recharge: '#06B6D4',
  investment: '#10B981',
  insurance: '#3B82F6',
  shopping: '#EC4899',
  transport: '#84CC16',
  healthcare: '#EF4444',
  entertainment: '#F97316',
  transfer: '#6B7280',
  other: '#9CA3AF',
}
