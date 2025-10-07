import { WeightUnit } from '@/stores/businessStore'

// 1 libra = 453.592 gramos
const GRAMS_PER_POUND = 453.592

/**
 * Convierte gramos a la unidad configurada
 */
export function formatWeight(grams: number, unit: WeightUnit): string {
  if (unit === 'pounds') {
    const pounds = grams / GRAMS_PER_POUND
    return `${pounds.toFixed(3)} lb`
  }
  return `${grams.toFixed(0)} g`
}

/**
 * Convierte de la unidad configurada a gramos
 */
export function toGrams(value: number, unit: WeightUnit): number {
  if (unit === 'pounds') {
    return value * GRAMS_PER_POUND
  }
  return value
}

/**
 * Convierte gramos a la unidad configurada (solo el número)
 */
export function convertFromGrams(grams: number, unit: WeightUnit): number {
  if (unit === 'pounds') {
    return grams / GRAMS_PER_POUND
  }
  return grams
}

/**
 * Obtiene la etiqueta de la unidad
 */
export function getWeightUnitLabel(unit: WeightUnit): string {
  return unit === 'pounds' ? 'Libras (lb)' : 'Gramos (g)'
}

/**
 * Obtiene el símbolo corto de la unidad
 */
export function getWeightUnitSymbol(unit: WeightUnit): string {
  return unit === 'pounds' ? 'lb' : 'g'
}
