import { apiFetch } from '@/lib/api'
import { PaymentMethod, SaleStatus, SaleType, type Sale, type CartItem, type Product, type ProductVariant, type SalePayment } from '@/types'

export type BackendPaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'NEQUI'
  | 'DAVIPLATA'
  | 'BANK_TRANSFER'
  | 'CREDIT'
  | 'OTHER'

export interface CreateSaleItemDto {
  productId: string
  productVariantId?: string
  quantity: number
  unitPrice: number
  discountAmount?: number
  discountPercent?: number
  notes?: string
}

export interface CreateSalePaymentDto {
  method: BackendPaymentMethod
  amount: number
  receivedAmount?: number
  transactionRef?: string
  notes?: string
}

export interface CreateSaleDto {
  customerId?: string
  type?: SaleType
  items: CreateSaleItemDto[]
  payments: CreateSalePaymentDto[]
  discountAmount?: number
  discountPercent?: number
  notes?: string
  creditDueDate?: string
}

export interface QuickSaleDto {
  productCode: string
  quantity?: number
  paymentMethod: BackendPaymentMethod
  receivedAmount?: number
}

export interface CalculateSaleItemDto {
  productId: string
  productVariantId?: string
  quantity: number
  unitPrice: number
  discountAmount?: number
  discountPercent?: number
}

export interface CalculateSaleDto {
  items: CalculateSaleItemDto[]
  discountAmount?: number
  discountPercent?: number
}

export interface CalculateSaleResult {
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
}

type BackendSaleItem = {
  id: string
  productId: string
  productVariantId?: string | null
  productName: string
  productSku: string
  variantName?: string | null
  quantity: number | string
  unitPrice: number | string
  discountAmount: number | string
  discountPercent: number | string
  taxRate: number | string
  taxAmount: number | string
  subtotal: number | string
  total: number | string
}

type BackendPayment = {
  id: string
  method: BackendPaymentMethod
  amount: number | string
  receivedAmount?: number | string | null
  changeGiven?: number | string | null
  status?: string
  transactionRef?: string | null
  notes?: string | null
}

type BackendCustomer = {
  id: string
  firstName?: string | null
  lastName?: string | null
  businessName?: string | null
  fullName?: string | null
}

type BackendSale = {
  id: string
  saleNumber?: string | null
  type: SaleType
  status: SaleStatus
  customerId?: string | null
  customer?: BackendCustomer | null
  subtotal: number | string
  discountAmount: number | string
  discountPercent: number | string
  taxAmount: number | string
  total: number | string
  paidAmount: number | string
  changeAmount: number | string
  creditAmount: number | string
  creditDueDate?: string | null
  notes?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  items: BackendSaleItem[]
  payments: BackendPayment[]
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

const toDate = (value?: string | null): Date => {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export const mapFrontPaymentMethodToBackend = (method: PaymentMethod): BackendPaymentMethod => {
  switch (method) {
    case PaymentMethod.CASH:
      return 'CASH'
    case PaymentMethod.NEQUI:
      return 'NEQUI'
    case PaymentMethod.DAVIPLATA:
      return 'DAVIPLATA'
    case PaymentMethod.CREDIT:
      return 'CREDIT'
    case PaymentMethod.BANK_TRANSFER:
      return 'BANK_TRANSFER'
    case PaymentMethod.OTHER:
      return 'OTHER'
    case PaymentMethod.CARD:
    default:
      return 'CREDIT_CARD'
  }
}

const mapBackendPaymentMethodToFront = (method: BackendPaymentMethod): PaymentMethod => {
  switch (method) {
    case 'CASH':
      return PaymentMethod.CASH
    case 'NEQUI':
      return PaymentMethod.NEQUI
    case 'DAVIPLATA':
      return PaymentMethod.DAVIPLATA
    case 'CREDIT':
      return PaymentMethod.CREDIT
    case 'BANK_TRANSFER':
      return PaymentMethod.BANK_TRANSFER
    case 'OTHER':
      return PaymentMethod.OTHER
    case 'CREDIT_CARD':
    case 'DEBIT_CARD':
    default:
      return PaymentMethod.CARD
  }
}

const buildCustomerName = (customer?: BackendCustomer | null): string | undefined => {
  if (!customer) return undefined
  if (customer.fullName && customer.fullName.trim().length > 0) return customer.fullName

  const businessName = customer.businessName?.trim()
  if (businessName) return businessName

  const firstName = customer.firstName?.trim() ?? ''
  const lastName = customer.lastName?.trim() ?? ''
  const full = `${firstName} ${lastName}`.trim()
  return full.length > 0 ? full : undefined
}

const mapBackendPayment = (payment: BackendPayment): SalePayment => ({
  id: payment.id,
  method: mapBackendPaymentMethodToFront(payment.method),
  amount: toNumber(payment.amount),
  receivedAmount: payment.receivedAmount != null ? toNumber(payment.receivedAmount) : undefined,
  changeGiven: payment.changeGiven != null ? toNumber(payment.changeGiven) : undefined,
  status: payment.status ?? undefined,
  transactionRef: payment.transactionRef ?? undefined,
  notes: payment.notes ?? undefined
})

const mapBackendSale = (sale: BackendSale): Sale => {
  const payments = Array.isArray(sale.payments) ? sale.payments.map(mapBackendPayment) : []
  const primaryPayment = payments[0]
  const primaryMethod = primaryPayment ? primaryPayment.method : PaymentMethod.CASH

  const items: CartItem[] = (sale.items ?? []).map((item) => {
    const taxRate = toNumber(item.taxRate)
    const unitPrice = toNumber(item.unitPrice)
    const quantity = toNumber(item.quantity)
    const discountPercent = toNumber(item.discountPercent)

    const discountFactor = 1 - (discountPercent / 100)
    const resolvedUnitPrice = unitPrice > 0 ? unitPrice : (() => {
      if (quantity <= 0 || discountFactor <= 0) {
        return 0
      }

      const subtotalValue = toNumber(item.subtotal)
      if (subtotalValue > 0) {
        return subtotalValue / quantity / discountFactor
      }

      const totalValue = toNumber(item.total)
      if (totalValue > 0) {
        const grossUnitAfterDiscount = totalValue / quantity
        const grossUnitBeforeDiscount = grossUnitAfterDiscount / discountFactor
        const divisor = 1 + (taxRate / 100)
        return divisor > 0 ? grossUnitBeforeDiscount / divisor : grossUnitBeforeDiscount
      }

      return 0
    })()

    const grossUnitPrice = resolvedUnitPrice * (1 + (taxRate / 100))
    const grossUnitAfterDiscount = grossUnitPrice * discountFactor

    const subtotal = (() => {
      const value = toNumber(item.subtotal)
      if (value > 0) return value
      const netBeforeDiscount = resolvedUnitPrice * quantity
      return netBeforeDiscount * discountFactor
    })()

    const total = (() => {
      const value = toNumber(item.total)
      if (value > 0) return value
      return grossUnitPrice * discountFactor * quantity
    })()

    const taxAmount = (() => {
      const value = toNumber(item.taxAmount)
      if (value > 0) return value
      return total - subtotal
    })()

    const product: Product = {
      id: item.productId,
      sku: item.productSku,
      name: item.productName,
      description: undefined,
      price: grossUnitPrice,
      stock: 0,
      category: '',
      image: undefined,
      tax: taxRate,
      variants: undefined,
      barcode: undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const variant: ProductVariant | undefined = item.productVariantId ? {
      id: item.productVariantId,
      productId: item.productId,
      name: item.variantName ?? 'Variante',
      sku: item.productSku ? `${item.productSku}-${String(item.productVariantId ?? '').slice(0, 4)}` : item.productVariantId ?? '',
      price: grossUnitPrice,
      stock: 0,
      attributes: {}
    } : undefined

    return {
      id: item.id,
      product,
      variant,
      quantity,
      price: grossUnitPrice,
      unitPrice: resolvedUnitPrice,
      discount: discountPercent,
      subtotal,
      tax: taxAmount,
      taxRate,
      total,
      notes: undefined
    }
  })

  const subtotal = toNumber(sale.subtotal)
  const discountAmount = toNumber(sale.discountAmount)
  const taxAmount = toNumber(sale.taxAmount)
  const total = toNumber(sale.total)
  const paidAmount = toNumber(sale.paidAmount)
  const changeAmount = toNumber(sale.changeAmount)
  const creditAmount = toNumber(sale.creditAmount)
  const cashReceived = primaryPayment?.receivedAmount ?? (primaryMethod === PaymentMethod.CASH ? paidAmount : undefined)
  const change = primaryPayment?.changeGiven ?? changeAmount

  return {
    id: sale.id,
    date: toDate(sale.createdAt),
    items,
    subtotal,
    discount: discountAmount,
    tax: taxAmount,
    total,
    paymentMethod: primaryMethod,
    customerId: sale.customerId ?? undefined,
    customerName: buildCustomerName(sale.customer ?? undefined),
    status: sale.status,
    invoiceNumber: sale.saleNumber ?? undefined,
    notes: sale.notes ?? undefined,
    cashReceived: cashReceived,
    change,
    createdBy: undefined,
    saleNumber: sale.saleNumber ?? undefined,
    payments,
    creditAmount: creditAmount,
    creditDueDate: sale.creditDueDate ? toDate(sale.creditDueDate) : undefined,
    saleType: sale.type,
    createdAt: sale.createdAt ? toDate(sale.createdAt) : undefined,
    updatedAt: sale.updatedAt ? toDate(sale.updatedAt) : undefined,
    primaryPaymentMethod: primaryMethod
  }
};

async function parseResponse<T>(response: Response, defaultMessage: string): Promise<T> {
  if (!response.ok) {
    let message = defaultMessage
    try {
      const errorBody = await response.json()
      if (typeof errorBody?.message === 'string') {
        message = errorBody.message
      } else if (Array.isArray(errorBody?.message)) {
        message = errorBody.message.join('\n')
      }
    } catch (error) {
      console.warn('No fue posible interpretar la respuesta de error', error)
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

class SalesService {
  async createSale(saleData: CreateSaleDto, token: string): Promise<Sale> {
    const response = await apiFetch('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
      token
    })

    const payload = await parseResponse<BackendSale>(response, 'Error al crear la venta')
    return mapBackendSale(payload)
  }

  async quickSale(saleData: QuickSaleDto, token: string): Promise<Sale> {
    const response = await apiFetch('/sales/quick', {
      method: 'POST',
      body: JSON.stringify(saleData),
      token
    })

    const payload = await parseResponse<BackendSale>(response, 'Error al crear la venta r?pida')
    return mapBackendSale(payload)
  }

  async calculateSale(data: CalculateSaleDto, token: string): Promise<CalculateSaleResult> {
    const response = await apiFetch('/sales/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
      token
    })

    const payload = await parseResponse<CalculateSaleResult>(response, 'Error al calcular la venta')
    return {
      subtotal: toNumber(payload.subtotal),
      discountAmount: toNumber(payload.discountAmount),
      taxAmount: toNumber(payload.taxAmount),
      total: toNumber(payload.total)
    }
  }

  async getSales(token: string, params?: {
    startDate?: Date
    endDate?: Date
    customerId?: string
    paymentMethod?: BackendPaymentMethod
  }): Promise<Sale[]> {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate.toISOString())
    if (params?.endDate) queryParams.append('endDate', params.endDate.toISOString())
    if (params?.customerId) queryParams.append('customerId', params.customerId)
    if (params?.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod)

    const response = await apiFetch(`/sales?${queryParams.toString()}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    const payload = await parseResponse<BackendSale[]>(response, 'Error al obtener las ventas')
    return payload.map(mapBackendSale)
  }

  async getSaleById(id: string, token: string): Promise<Sale> {
    const response = await apiFetch(`/sales/${id}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    const payload = await parseResponse<BackendSale>(response, 'Error al obtener la venta')
    return mapBackendSale(payload)
  }

  async cancelSale(id: string, reason: string, token: string): Promise<Sale> {
    const response = await apiFetch(`/sales/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      token
    })

    const payload = await parseResponse<BackendSale>(response, 'Error al cancelar la venta')
    return mapBackendSale(payload)
  }

  async getTodaySales(token: string): Promise<Sale[]> {
    const response = await apiFetch('/sales/today', {
      method: 'GET',
      token,
      skipContentType: true
    })

    const payload = await parseResponse<BackendSale[]>(response, 'Error al obtener las ventas del d?a')
    return payload.map(mapBackendSale)
  }

  async getSalesSummary(token: string, startDate?: Date, endDate?: Date) {
    const queryParams = new URLSearchParams()
    if (startDate) queryParams.append('startDate', startDate.toISOString())
    if (endDate) queryParams.append('endDate', endDate.toISOString())

    const response = await apiFetch(`/sales/summary?${queryParams.toString()}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    return parseResponse(response, 'Error al obtener el resumen de ventas')
  }
}

export const salesService = new SalesService()








