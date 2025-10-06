import { 
  toNumber, 
  toDecimal, 
  safeAdd, 
  safeSubtract, 
  safeMultiply, 
  safeDivide,
  calculatePercentage,
  isPositiveNumber,
  isNonNegativeNumber,
  formatCurrency,
  formatDecimal
} from './number.utils';

describe('Number Utils', () => {
  describe('toNumber', () => {
    it('should convert string numbers to numbers', () => {
      expect(toNumber('123')).toBe(123);
      expect(toNumber('123.456')).toBe(123.456);
      expect(toNumber('-123')).toBe(-123);
      expect(toNumber('0')).toBe(0);
    });

    it('should convert database decimal strings', () => {
      expect(toNumber('0.000')).toBe(0);
      expect(toNumber('10.500')).toBe(10.5);
      expect(toNumber('-5.250')).toBe(-5.25);
    });

    it('should handle null and undefined', () => {
      expect(toNumber(null)).toBe(0);
      expect(toNumber(undefined)).toBe(0);
      expect(toNumber(null, 10)).toBe(10);
      expect(toNumber(undefined, -1)).toBe(-1);
    });

    it('should handle invalid values', () => {
      expect(toNumber('')).toBe(0);
      expect(toNumber('abc')).toBe(0);
      expect(toNumber(NaN)).toBe(0);
      expect(toNumber(Infinity)).toBe(0);
      expect(toNumber('abc', 100)).toBe(100);
    });

    it('should handle numbers as input', () => {
      expect(toNumber(123)).toBe(123);
      expect(toNumber(0)).toBe(0);
      expect(toNumber(-456)).toBe(-456);
    });
  });

  describe('toDecimal', () => {
    it('should round to specified precision', () => {
      expect(toDecimal('123.456789', 2)).toBe(123.46);
      expect(toDecimal('123.456789', 3)).toBe(123.457);
      expect(toDecimal('123.4', 2)).toBe(123.4);
    });
  });

  describe('safeAdd', () => {
    it('should add string numbers', () => {
      expect(safeAdd('10', '20')).toBe(30);
      expect(safeAdd('10.5', '20.5')).toBe(31);
    });

    it('should handle database concatenation issue', () => {
      // This is the critical test case
      expect(safeAdd('0.000', -1)).toBe(-1);
      expect(safeAdd('10.000', -5)).toBe(5);
    });

    it('should handle null values', () => {
      expect(safeAdd(null, 10)).toBe(10);
      expect(safeAdd(10, null)).toBe(10);
      expect(safeAdd(null, null)).toBe(0);
    });
  });

  describe('safeSubtract', () => {
    it('should subtract string numbers', () => {
      expect(safeSubtract('20', '10')).toBe(10);
      expect(safeSubtract('20.5', '10.5')).toBe(10);
    });

    it('should handle database values', () => {
      expect(safeSubtract('5.000', '3')).toBe(2);
      expect(safeSubtract('0.000', '1')).toBe(-1);
    });
  });

  describe('safeMultiply', () => {
    it('should multiply string numbers', () => {
      expect(safeMultiply('10', '5')).toBe(50);
      expect(safeMultiply('10.5', '2')).toBe(21);
    });
  });

  describe('safeDivide', () => {
    it('should divide string numbers', () => {
      expect(safeDivide('20', '5')).toBe(4);
      expect(safeDivide('21', '2')).toBe(10.5);
    });

    it('should handle division by zero', () => {
      expect(safeDivide('10', '0')).toBe(0);
      expect(safeDivide('10', '0', -1)).toBe(-1);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage('100', '10')).toBe(10);
      expect(calculatePercentage('50000', '19')).toBe(9500);
    });
  });

  describe('isPositiveNumber', () => {
    it('should validate positive numbers', () => {
      expect(isPositiveNumber('10')).toBe(true);
      expect(isPositiveNumber('0.001')).toBe(true);
      expect(isPositiveNumber('0')).toBe(false);
      expect(isPositiveNumber('-1')).toBe(false);
      expect(isPositiveNumber('abc')).toBe(false);
      expect(isPositiveNumber(null)).toBe(false);
    });
  });

  describe('isNonNegativeNumber', () => {
    it('should validate non-negative numbers', () => {
      expect(isNonNegativeNumber('10')).toBe(true);
      expect(isNonNegativeNumber('0')).toBe(true);
      expect(isNonNegativeNumber('-1')).toBe(false);
      expect(isNonNegativeNumber('abc')).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('should format Colombian currency', () => {
      expect(formatCurrency(50000)).toBe('$ 50.000');
      expect(formatCurrency('50000')).toBe('$ 50.000');
      expect(formatCurrency(50000, false)).toBe('50.000');
    });
  });

  describe('formatDecimal', () => {
    it('should format decimal numbers', () => {
      expect(formatDecimal('10.5', 2)).toBe('10,50');
      expect(formatDecimal('1000.123456', 3)).toBe('1.000,123');
    });
  });
});
