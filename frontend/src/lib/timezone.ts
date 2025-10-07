import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz'

// Timezone de Colombia
export const COLOMBIA_TZ = 'America/Bogota'

/**
 * Convierte una fecha a la zona horaria de Colombia
 */
export function toColombiaTime(date: Date): Date {
  return toZonedTime(date, COLOMBIA_TZ)
}

/**
 * Convierte una fecha de la zona horaria de Colombia a UTC
 */
export function fromColombiaTime(date: Date): Date {
  return fromZonedTime(date, COLOMBIA_TZ)
}

/**
 * Obtiene el inicio del día en timezone de Colombia (00:00:00)
 */
export function getStartOfDayColombia(date: Date = new Date()): Date {
  const colombiaDate = toColombiaTime(date)
  colombiaDate.setHours(0, 0, 0, 0)
  return fromColombiaTime(colombiaDate)
}

/**
 * Obtiene el fin del día en timezone de Colombia (23:59:59)
 */
export function getEndOfDayColombia(date: Date = new Date()): Date {
  const colombiaDate = toColombiaTime(date)
  colombiaDate.setHours(23, 59, 59, 999)
  return fromColombiaTime(colombiaDate)
}

/**
 * Formatea una fecha en timezone de Colombia
 */
export function formatColombiaDate(date: Date, formatStr: string = 'dd/MM/yyyy HH:mm'): string {
  return formatTz(toColombiaTime(date), formatStr, { timeZone: COLOMBIA_TZ })
}

/**
 * Obtiene el rango de fechas para "Hoy" en Colombia
 */
export function getTodayRangeColombia(): { startDate: Date; endDate: Date } {
  const now = new Date()
  return {
    startDate: getStartOfDayColombia(now),
    endDate: getEndOfDayColombia(now)
  }
}

/**
 * Obtiene el rango de fechas para "Última semana" en Colombia
 */
export function getWeekRangeColombia(): { startDate: Date; endDate: Date } {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - 7)

  return {
    startDate: getStartOfDayColombia(startDate),
    endDate: getEndOfDayColombia(now)
  }
}

/**
 * Obtiene el rango de fechas para "Último mes" en Colombia
 */
export function getMonthRangeColombia(): { startDate: Date; endDate: Date } {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setMonth(startDate.getMonth() - 1)

  return {
    startDate: getStartOfDayColombia(startDate),
    endDate: getEndOfDayColombia(now)
  }
}

/**
 * Obtiene el rango de fechas para "Último año" en Colombia
 */
export function getYearRangeColombia(): { startDate: Date; endDate: Date } {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setFullYear(startDate.getFullYear() - 1)

  return {
    startDate: getStartOfDayColombia(startDate),
    endDate: getEndOfDayColombia(now)
  }
}
