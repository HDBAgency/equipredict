import { type ClassValue, clsx } from 'clsx'

// Pour installer clsx: npm install clsx
// Utilisé pour les classes conditionnelles Tailwind
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(isoString))
}

export function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  }).format(new Date(isoString))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(amount)
}

export function formatOdds(odds: number): string {
  return odds.toFixed(1)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)} %`
}
