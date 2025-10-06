/**
 * Utility functions for safe number conversions
 * These functions handle database numeric values that may come as strings
 */

/**
 * Safely converts a value to a number
 * @param value - The value to convert (can be string, number, null, undefined, etc.)
 * @param defaultValue - The default value to return if conversion fails (default: 0)
 * @returns A valid number or the default value
 */
export function toNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const num = Number(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  
  return num;
}

/**
 * Safely converts a value to a decimal number with specified precision
 * @param value - The value to convert
 * @param precision - Number of decimal places
 * @param defaultValue - The default value to return if conversion fails
 * @returns A number with the specified precision
 */
export function toDecimal(value: any, precision: number = 2, defaultValue: number = 0): number {
  const num = toNumber(value, defaultValue);
  return Number(num.toFixed(precision));
}

/**
 * Safely adds two numeric values (handles database strings)
 * @param a - First value
 * @param b - Second value
 * @returns The sum of the two values
 */
export function safeAdd(a: any, b: any): number {
  return toNumber(a) + toNumber(b);
}

/**
 * Safely subtracts two numeric values (handles database strings)
 * @param a - First value
 * @param b - Second value
 * @returns The difference (a - b)
 */
export function safeSubtract(a: any, b: any): number {
  return toNumber(a) - toNumber(b);
}

/**
 * Safely multiplies two numeric values (handles database strings)
 * @param a - First value
 * @param b - Second value
 * @returns The product of the two values
 */
export function safeMultiply(a: any, b: any): number {
  return toNumber(a) * toNumber(b);
}

/**
 * Safely divides two numeric values (handles database strings and division by zero)
 * @param numerator - The numerator
 * @param denominator - The denominator
 * @param defaultValue - Value to return if division by zero
 * @returns The quotient or defaultValue if division by zero
 */
export function safeDivide(numerator: any, denominator: any, defaultValue: number = 0): number {
  const num = toNumber(numerator);
  const den = toNumber(denominator);
  
  if (den === 0) {
    return defaultValue;
  }
  
  return num / den;
}

/**
 * Calculates percentage safely
 * @param value - The value
 * @param percentage - The percentage to calculate
 * @returns The percentage of the value
 */
export function calculatePercentage(value: any, percentage: any): number {
  return safeMultiply(value, percentage) / 100;
}

/**
 * Validates if a value is a valid positive number
 * @param value - The value to validate
 * @returns true if the value is a positive number
 */
export function isPositiveNumber(value: any): boolean {
  const num = toNumber(value, -1);
  return num > 0 && isFinite(num);
}

/**
 * Validates if a value is a valid non-negative number
 * @param value - The value to validate
 * @returns true if the value is zero or positive
 */
export function isNonNegativeNumber(value: any): boolean {
  const num = toNumber(value, -1);
  return num >= 0 && isFinite(num);
}

/**
 * Formats a number as currency (Colombian Pesos)
 * @param value - The value to format
 * @param showSymbol - Whether to show the currency symbol
 * @returns Formatted currency string
 */
export function formatCurrency(value: any, showSymbol: boolean = true): string {
  const num = toNumber(value);
  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
  
  return showSymbol ? `$ ${formatted}` : formatted;
}

/**
 * Formats a number with decimal places
 * @param value - The value to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export function formatDecimal(value: any, decimals: number = 2): string {
  const num = toNumber(value);
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}
