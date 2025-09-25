// Tipos principales de la aplicaciÃ³n

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  price: number
  stock: number
  category: string
  image?: string
  tax: number // Porcentaje de impuesto (ej: 19 para 19%)
  variants?: ProductVariant[]
  barcode?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariant {
  id: string
  productId: string
  name: string // ej: "Talla M - Color Azul"
  sku: string
  price?: number // Si es diferente al producto base
  stock: number
  attributes: Record<string, string> // { talla: "M", color: "Azul" }
}

export interface CartItem {
  id: string
  product: Product
  variant?: ProductVariant
  quantity: number
  price: number
  unitPrice: number
  discount: number // Porcentaje de descuento
  subtotal: number
  tax: number
  taxRate?: number
  total: number
  notes?: string
}

export interface Sale {
  id: string
  date: Date
  items: CartItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  primaryPaymentMethod?: PaymentMethod
  payments?: SalePayment[]
  customerId?: string
  customerName?: string
  status: SaleStatus
  saleType?: SaleType
  saleNumber?: string
  invoiceNumber?: string
  notes?: string
  cashReceived?: number
  change?: number
  creditAmount?: number
  creditDueDate?: Date
  createdBy?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface PaymentInfo {
  id: string
  method: PaymentMethod
  amount: number
  receivedAmount?: number
  changeGiven?: number
}

export interface SalePayment {
  id: string
  method: PaymentMethod
  amount: number
  receivedAmount?: number
  changeGiven?: number
  status?: string
  transactionRef?: string
  notes?: string
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  NEQUI = 'nequi',
  DAVIPLATA = 'daviplata',
  CREDIT = 'credit', // Fiado
  BANK_TRANSFER = 'bank_transfer',
  OTHER = 'other'
}

export enum SaleType {
  REGULAR = 'REGULAR',
  CREDIT = 'CREDIT',
  RETURN = 'RETURN'
}

export enum SaleStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export interface Customer {
  id: string
  name: string
  document?: string // CÃ©dula o NIT
  phone?: string
  email?: string
  address?: string
  creditLimit?: number
  currentDebt?: number
  createdAt: Date
  updatedAt: Date
}

export interface CreditSale {
  id: string
  saleId: string
  customerId: string
  customer: Customer
  amount: number
  paidAmount: number
  remainingAmount: number
  dueDate?: Date
  status: CreditStatus
  payments: CreditPayment[]
  createdAt: Date
  updatedAt: Date
}

export enum CreditStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

export interface CreditPayment {
  id: string
  creditSaleId: string
  amount: number
  paymentMethod: PaymentMethod
  date: Date
  notes?: string
}

export interface CashRegister {
  id: string
  openingDate: Date
  closingDate?: Date
  openingAmount: number
  expectedAmount?: number
  actualAmount?: number
  difference?: number
  sales: Sale[]
  expenses: Expense[]
  status: RegisterStatus
  openedBy: string
  closedBy?: string
}

export enum RegisterStatus {
  OPEN = 'open',
  CLOSED = 'closed'
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: Date
  createdBy: string
}

export interface User {
  id: string
  name: string
  email?: string
  phone?: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  ADMIN = 'admin',
  CASHIER = 'cashier',
  MANAGER = 'manager'
}

export interface Business {
  id: string
  name: string
  nit: string
  address: string
  phone?: string
  email?: string
  logo?: string
  dianResolution?: DianResolution
  createdAt: Date
  updatedAt: Date
}

export interface DianResolution {
  resolution: string
  prefix: string
  startNumber: number
  endNumber: number
  startDate: Date
  endDate: Date
  currentNumber: number
}

export interface AppState {
  user: User | null
  business: Business | null
  currentRegister: CashRegister | null
  cart: CartItem[]
  isLoading: boolean
  error: string | null
}

export interface QuickKey {
  id: string
  productId: string
  product: Product
  position: number
  color?: string
  icon?: string
}

export interface Settings {
  quickKeys: QuickKey[]
  defaultTaxRate: number
  printAutomatically: boolean
  requireCustomerForCredit: boolean
  lowStockAlert: number
  currency: string
  language: string
}
