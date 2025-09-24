import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para formatear números como moneda colombiana
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Función para formatear fecha y hora
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}

// Función para calcular el total con impuestos
export function calculateTax(subtotal: number, taxRate: number = 19): number {
  return subtotal * (taxRate / 100)
}

// Función para generar un ID único simple
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
