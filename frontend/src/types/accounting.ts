/**
 * Tipos TypeScript para el módulo de Contabilidad
 *
 * Estos tipos se corresponden con los DTOs del backend
 */

// ========================================
// DASHBOARD
// ========================================

export interface DashboardData {
  sales: {
    total: number;
    trend: number;
    comparedTo: string;
  };
  expenses: {
    total: number;
    breakdown: Array<{
      category: string;
      percentage: number;
      amount: number;
    }>;
  };
  netProfit: {
    value: number;
    type: 'positive' | 'negative';
  };
  availableMoney: {
    cash: number;
    bank: number;
    total: number;
  };
  taxProvision: {
    total: number;
    breakdown: {
      iva: number;
      withholdings: number;
    };
  };
  period: {
    month: number;
    year: number;
    monthName: string;
  };
}

// ========================================
// GASTOS
// ========================================

export enum ExpenseType {
  INVENTORY_PURCHASE = 'INVENTORY_PURCHASE',
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  INTERNET_PHONE = 'INTERNET_PHONE',
  PAYROLL = 'PAYROLL',
  PROFESSIONAL_SERVICES = 'PROFESSIONAL_SERVICES',
  INSURANCE = 'INSURANCE',
  MAINTENANCE = 'MAINTENANCE',
  TRAVEL = 'TRAVEL',
  ADVERTISING = 'ADVERTISING',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  TAXES_FEES = 'TAXES_FEES',
  OTHER = 'OTHER'
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK = 'BANK',
  CARD = 'CARD',
  CREDIT = 'CREDIT'
}

export interface Expense {
  id: string;
  expenseNumber: string;
  type: ExpenseType;
  status: ExpenseStatus;
  expenseDate: Date;
  supplierName?: string;
  supplierNit?: string;
  invoiceNumber?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDate?: Date;
  description?: string;
  invoiceImageUrl?: string;
  isOcrExtracted: boolean;
  journalEntryId?: string;
  createdAt: Date;
  updatedAt: Date;
  icon: string;
  pucCode: string;
}

export interface CreateExpenseDto {
  type: ExpenseType;
  expenseDate: Date | string;
  supplierName?: string;
  supplierNit?: string;
  invoiceNumber?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDate?: Date | string;
  description?: string;
  invoiceImageUrl?: string;
}

export interface ExpenseStats {
  total: number;
  count: number;
  byType: Array<{
    type: string;
    icon: string;
    total: number;
    count: number;
    percentage: number;
  }>;
  byMonth: Array<{
    month: string;
    total: number;
    count: number;
  }>;
}

// ========================================
// REPORTES
// ========================================

export interface IVAReport {
  period: {
    startDate: string;
    endDate: string;
    description: string;
  };
  summary: {
    ivaGenerado: number;
    ivaDescontable: number;
    saldo: number;
    tipo: 'a_pagar' | 'a_favor';
  };
  sales: {
    totalSales: number;
    baseGravable: number;
    salesExcludedFromIva: number;
    byTaxRate: Array<{
      rate: number;
      baseGravable: number;
      ivaAmount: number;
    }>;
  };
  purchases: {
    totalPurchases: number;
    baseGravable: number;
  };
}

export interface ProfitAndLoss {
  period: {
    startDate: string;
    endDate: string;
    description: string;
  };
  revenue: {
    sales: number;
    otherIncome: number;
    total: number;
  };
  expenses: {
    costOfSales: number;
    operatingExpenses: number;
    total: number;
    byCategory: Array<{
      categoryName: string;
      amount: number;
    }>;
  };
  grossProfit: number;
  netProfit: number;
}

export interface BalanceSheet {
  date: string;
  assets: {
    current: {
      cash: number;
      bank: number;
      accounts_receivable: number;
      inventory: number;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      accounts_payable: number;
      taxes_payable: number;
      total: number;
    };
    total: number;
  };
  equity: {
    capital: number;
    retained_earnings: number;
    current_profit: number;
    total: number;
  };
}

export interface ExpensesByCategory {
  period: {
    startDate: string;
    endDate: string;
    description: string;
  };
  categories: Array<{
    category: string;
    icon: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  total: number;
}

// ========================================
// CONFIGURACIÓN FISCAL
// ========================================

export enum TaxRegime {
  SIMPLIFIED = 'SIMPLIFIED',
  COMMON = 'COMMON',
  LARGE_TAXPAYER = 'LARGE_TAXPAYER'
}

export enum IVAResponsibility {
  RESPONSIBLE = 'RESPONSIBLE',
  NON_RESPONSIBLE = 'NON_RESPONSIBLE',
  NON_DECLARANT = 'NON_DECLARANT'
}

export interface FiscalConfig {
  id?: string;
  businessName: string;
  nit: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  taxRegime: TaxRegime;
  ivaResponsibility: IVAResponsibility;
  retentionAgent: boolean;
  ciiu?: string;
  economicActivity?: string;
  enableElectronicInvoicing: boolean;
  resolutionNumber?: string;
  resolutionDate?: Date | string;
  technicalKey?: string;
  prefixInvoice?: string;
  fromInvoice?: number;
  toInvoice?: number;
  currentInvoiceNumber?: number;
  validUntil?: Date | string;
  testSetId?: string;
}

export interface FiscalSummary {
  businessName: string;
  nit: string;
  taxRegime: TaxRegime;
  ivaResponsibility: IVAResponsibility;
  electronicInvoicingEnabled: boolean;
  resolutionValid: boolean;
  numberingExhausted: boolean;
  currentInvoiceNumber?: number;
  remainingInvoices?: number;
}

// ========================================
// ASIENTOS CONTABLES
// ========================================

export enum JournalEntryType {
  SALE = 'SALE',
  EXPENSE = 'EXPENSE',
  PURCHASE = 'PURCHASE',
  PAYMENT = 'PAYMENT',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum MovementType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT'
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  movementType: MovementType;
  amount: number;
  description: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  type: JournalEntryType;
  entryDate: Date;
  description: string;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  lines: JournalEntryLine[];
  createdAt: Date;
}

// ========================================
// CATEGORÍAS DE GASTOS CON ICONOS
// ========================================

export interface ExpenseCategory {
  type: ExpenseType;
  label: string;
  icon: string;
  pucCode: string;
  description: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    type: ExpenseType.INVENTORY_PURCHASE,
    label: 'Compra de Inventario',
    icon: '🛒',
    pucCode: '1435',
    description: 'Compras de mercancía para la venta'
  },
  {
    type: ExpenseType.RENT,
    label: 'Arriendo',
    icon: '🏢',
    pucCode: '5120',
    description: 'Pago de arrendamiento del local'
  },
  {
    type: ExpenseType.UTILITIES,
    label: 'Servicios Públicos',
    icon: '💡',
    pucCode: '5135',
    description: 'Luz, agua, gas'
  },
  {
    type: ExpenseType.INTERNET_PHONE,
    label: 'Internet y Teléfono',
    icon: '📱',
    pucCode: '5135',
    description: 'Servicios de comunicación'
  },
  {
    type: ExpenseType.PAYROLL,
    label: 'Nómina',
    icon: '👥',
    pucCode: '5105',
    description: 'Salarios y prestaciones'
  },
  {
    type: ExpenseType.PROFESSIONAL_SERVICES,
    label: 'Servicios Profesionales',
    icon: '⚖️',
    pucCode: '5110',
    description: 'Contador, abogado, consultor'
  },
  {
    type: ExpenseType.INSURANCE,
    label: 'Seguros',
    icon: '🛡️',
    pucCode: '5130',
    description: 'Pólizas de seguro'
  },
  {
    type: ExpenseType.MAINTENANCE,
    label: 'Mantenimiento',
    icon: '🔧',
    pucCode: '5145',
    description: 'Reparaciones y mantenimiento'
  },
  {
    type: ExpenseType.TRAVEL,
    label: 'Viáticos',
    icon: '✈️',
    pucCode: '5155',
    description: 'Gastos de viaje'
  },
  {
    type: ExpenseType.ADVERTISING,
    label: 'Publicidad',
    icon: '📢',
    pucCode: '5240',
    description: 'Marketing y publicidad'
  },
  {
    type: ExpenseType.OFFICE_SUPPLIES,
    label: 'Papelería',
    icon: '📋',
    pucCode: '5195',
    description: 'Útiles de oficina'
  },
  {
    type: ExpenseType.TAXES_FEES,
    label: 'Impuestos y Tasas',
    icon: '💰',
    pucCode: '5115',
    description: 'Impuestos municipales'
  },
  {
    type: ExpenseType.OTHER,
    label: 'Otros Gastos',
    icon: '➕',
    pucCode: '5195',
    description: 'Gastos diversos'
  }
];

// ========================================
// MÉTODOS DE PAGO CON ICONOS
// ========================================

export interface PaymentMethodOption {
  method: PaymentMethod;
  label: string;
  icon: string;
  accountCode: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    method: PaymentMethod.CASH,
    label: 'Efectivo',
    icon: '💵',
    accountCode: '1105'
  },
  {
    method: PaymentMethod.BANK,
    label: 'Transferencia',
    icon: '🏦',
    accountCode: '1110'
  },
  {
    method: PaymentMethod.CARD,
    label: 'Tarjeta',
    icon: '💳',
    accountCode: '1110'
  },
  {
    method: PaymentMethod.CREDIT,
    label: 'Crédito',
    icon: '📝',
    accountCode: '2205'
  }
];
