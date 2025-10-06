const POUND_IN_GRAMS = 453.592;

export function gramsToPounds(grams: number): number {
  if (typeof grams !== 'number' || !Number.isFinite(grams)) return 0;
  return grams / POUND_IN_GRAMS;
}

export function poundsToGrams(pounds: number): number {
  if (typeof pounds !== 'number' || !Number.isFinite(pounds)) return 0;
  return pounds * POUND_IN_GRAMS;
}
