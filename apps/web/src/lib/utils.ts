import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// shadcn/ui required utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Format currency in SEK ────────────────────────────────────────────────────
export function formatSEK(amount: number, compact = false): string {
  if (compact && amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k kr`
  }
  return new Intl.NumberFormat('sv-SE', {
    style:                 'currency',
    currency:              'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Format date in Swedish ────────────────────────────────────────────────────
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  }
): string {
  return new Intl.DateTimeFormat('sv-SE', options).format(new Date(date))
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    hour:   '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date, { day: 'numeric', month: 'short' })} kl. ${formatTime(date)}`
}

// ── RUT calculation (mirror of backend) ──────────────────────────────────────
export function calculateRutDisplay(totalInclVat: number): {
  fullPrice:    number
  rutDeduction: number
  customerPays: number
  savings:      number
  savingsPct:   number
} {
  const rutDeduction = +(totalInclVat * 0.5).toFixed(0)
  const customerPays = totalInclVat - rutDeduction
  return {
    fullPrice:    totalInclVat,
    rutDeduction,
    customerPays,
    savings:      rutDeduction,
    savingsPct:   50,
  }
}

// ── Booking status labels ─────────────────────────────────────────────────────
export const BOOKING_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Väntar',     color: 'text-amber-600 bg-amber-50' },
  confirmed:   { label: 'Bekräftad',  color: 'text-teal-600 bg-teal-50' },
  in_progress: { label: 'Pågår',      color: 'text-brand-600 bg-brand-50' },
  completed:   { label: 'Klar',       color: 'text-neutral-600 bg-neutral-100' },
  cancelled:   { label: 'Avbokad',    color: 'text-red-600 bg-red-50' },
}

// ── Truncate text ─────────────────────────────────────────────────────────────
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

// ── Sleep (for testing) ───────────────────────────────────────────────────────
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
