import { apiFetch } from '@/lib/api'
import type { Product } from '@/types'

export interface ReportFilters {
  startDate?: Date
  endDate?: Date
  paymentMethod?: string
  customerId?: string
  productId?: string
  format?: string
}

export interface TaxBreakdown {
  iva19: {
    baseGravable: number
    ivaAmount: number
  }
  iva5: {
    baseGravable: number
    ivaAmount: number
  }
  iva0: {
    baseGravable: number
    ivaAmount: number
  }
  inc: {
    baseGravable: number
    incAmount: number
  }
  totalTax: number
  totalBase: number
}

export interface SalesReport {
  totalSales: number              // Cantidad de ventas
  totalSalesAmount: number         // Monto total facturado (incluye crédito)
  totalIncome: number              // Ingresos reales en caja (excluye crédito)
  totalCreditSales: number         // Monto vendido a crédito
  creditSalesCount: number         // Cantidad de ventas a crédito
  creditPending: number            // Saldo pendiente de cobro
  averageTicket: number            // Ticket promedio
  salesByPaymentMethod: Record<string, number>
  salesByHour: Record<number, number>
  taxBreakdown: TaxBreakdown       // Desglose de IVA por tasa

  // Legacy fields (deprecated)
  totalRevenue?: number
  creditSales?: number
}

export interface ProductReport {
  product: Product
  quantity: number
  revenue: number
  profitMargin?: number
}

export interface CustomerReport {
  customerId: string
  customerName: string
  totalPurchases: number
  totalSpent: number
  averagePurchase: number
  lastPurchase: Date
}

export interface InventoryReport {
  totalProducts: number
  totalValue: number
  lowStockProducts: Product[]
  outOfStockProducts: Product[]
  mostSoldProducts: ProductReport[]
  leastSoldProducts: ProductReport[]
}

export interface CashRegisterArqueo {
  sessionId: string
  sessionNumber: string
  openedAt: Date
  closedAt: Date
  openedBy: string
  closedBy: string

  // Balances
  openingBalance: number
  expectedBalance: number
  actualBalance: number
  difference: number

  // Ventas por método
  totalCashSales: number
  totalCardSales: number
  totalDigitalSales: number
  totalCreditSales: number

  // Totales
  totalSales: number
  totalExpenses: number
  totalTransactions: number

  // Notas
  openingNotes?: string
  closingNotes?: string
  discrepancyReason?: string

  // Estado
  status: string
}

export interface CashRegisterReport {
  summary: {
    totalSessions: number
    totalSales: number
    totalExpenses: number
    totalDiscrepancies: number
    sessionsWithDiscrepancies: number
    discrepancyRate: number
  }
  arqueos: CashRegisterArqueo[]
}

export interface InventoryMovement {
  id: string
  productId: string
  productVariantId?: string
  movementType: string
  quantity: number
  quantityBefore: number
  quantityAfter: number
  unitCost: number
  totalCost: number
  referenceType?: string
  referenceId?: string
  referenceNumber?: string
  batchNumber?: string
  expiryDate?: Date
  warehouseId?: string
  warehouseName?: string
  notes?: string
  reason?: string
  userId?: string
  createdAt: Date
}

export interface InventoryMovementsReport {
  summary: {
    totalMovements: number
    totalIn: number
    totalOut: number
    netMovement: number
    totalCostIn: number
    totalCostOut: number
    movementsByType: Record<string, { count: number; quantity: number; totalCost: number }>
  }
  movements: InventoryMovement[]
}

class ReportsService {
  async getSalesReport(token: string, filters?: ReportFilters): Promise<SalesReport> {
    console.log('Token in getSalesReport:', token);
    const params = this.buildQueryParams(filters)
    const response = await apiFetch(`/reports/sales?${params}`, {
      method: 'GET',
      token,
      skipContentType: true
    })
    
    if (!response.ok) {
      throw new Error('Error al obtener el reporte de ventas')
    }
    
    const data = await response.json()
    return {
      totalSales: data.totalSales || 0,
      totalSalesAmount: Number(data.totalSalesAmount || 0),
      totalIncome: Number(data.totalIncome || 0),
      totalCreditSales: Number(data.totalCreditSales || 0),
      creditSalesCount: Number(data.creditSalesCount || 0),
      creditPending: Number(data.creditPending || 0),
      averageTicket: Number(data.averageTicket || 0),
      salesByPaymentMethod: data.salesByPaymentMethod || {},
      salesByHour: data.salesByHour || {},
      taxBreakdown: data.taxBreakdown || {
        iva19: { baseGravable: 0, ivaAmount: 0 },
        iva5: { baseGravable: 0, ivaAmount: 0 },
        iva0: { baseGravable: 0, ivaAmount: 0 },
        inc: { baseGravable: 0, incAmount: 0 },
        totalTax: 0,
        totalBase: 0
      },

      // Legacy
      totalRevenue: Number(data.totalRevenue || 0),
      creditSales: Number(data.creditSales || 0)
    }
  }

  async getProductsReport(token: string, filters?: ReportFilters): Promise<ProductReport[]> {
    const params = this.buildQueryParams(filters)
    const response = await apiFetch(`/reports/products?${params}`, {
      method: 'GET',
      token,
      skipContentType: true
    })
    
    if (!response.ok) {
      throw new Error('Error al obtener el reporte de productos')
    }
    
    const data = await response.json()
    return data.map((item: any) => ({
      product: item.product,
      quantity: item.quantity || 0,
      revenue: Number(item.revenue || 0),
      profitMargin: item.profitMargin ? Number(item.profitMargin) : undefined
    }))
  }

  async getCustomersReport(token: string, filters?: ReportFilters): Promise<CustomerReport[]> {
    const params = this.buildQueryParams(filters)
    const response = await apiFetch(`/reports/customers?${params}`, {
      method: 'GET',
      token,
      skipContentType: true
    })
    
    if (!response.ok) {
      throw new Error('Error al obtener el reporte de clientes')
    }
    
    const data = await response.json()
    return data.map((item: any) => ({
      customerId: item.customerId,
      customerName: item.customerName,
      totalPurchases: item.totalPurchases || 0,
      totalSpent: Number(item.totalSpent || 0),
      averagePurchase: Number(item.averagePurchase || 0),
      lastPurchase: new Date(item.lastPurchase)
    }))
  }

  async getInventoryReport(token: string): Promise<InventoryReport> {
    const response = await apiFetch('/reports/inventory', {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Error al obtener el reporte de inventario')
    }

    const data = await response.json()
    return {
      totalProducts: data.totalProducts || 0,
      totalValue: Number(data.totalValue || 0),
      lowStockProducts: data.lowStockProducts || [],
      outOfStockProducts: data.outOfStockProducts || [],
      mostSoldProducts: data.mostSoldProducts || [],
      leastSoldProducts: data.leastSoldProducts || []
    }
  }

  async getCashRegisterReport(token: string, filters?: ReportFilters): Promise<CashRegisterReport> {
    const params = this.buildQueryParams(filters)
    const response = await apiFetch(`/reports/cash-register?${params}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Error al obtener el reporte de arqueos')
    }

    const data = await response.json()
    return {
      summary: {
        totalSessions: data.summary?.totalSessions || 0,
        totalSales: Number(data.summary?.totalSales || 0),
        totalExpenses: Number(data.summary?.totalExpenses || 0),
        totalDiscrepancies: Number(data.summary?.totalDiscrepancies || 0),
        sessionsWithDiscrepancies: data.summary?.sessionsWithDiscrepancies || 0,
        discrepancyRate: Number(data.summary?.discrepancyRate || 0)
      },
      arqueos: (data.arqueos || []).map((arq: any) => ({
        sessionId: arq.sessionId,
        sessionNumber: arq.sessionNumber,
        openedAt: new Date(arq.openedAt),
        closedAt: new Date(arq.closedAt),
        openedBy: arq.openedBy,
        closedBy: arq.closedBy,
        openingBalance: Number(arq.openingBalance || 0),
        expectedBalance: Number(arq.expectedBalance || 0),
        actualBalance: Number(arq.actualBalance || 0),
        difference: Number(arq.difference || 0),
        totalCashSales: Number(arq.totalCashSales || 0),
        totalCardSales: Number(arq.totalCardSales || 0),
        totalDigitalSales: Number(arq.totalDigitalSales || 0),
        totalCreditSales: Number(arq.totalCreditSales || 0),
        totalSales: Number(arq.totalSales || 0),
        totalExpenses: Number(arq.totalExpenses || 0),
        totalTransactions: Number(arq.totalTransactions || 0),
        openingNotes: arq.openingNotes,
        closingNotes: arq.closingNotes,
        discrepancyReason: arq.discrepancyReason,
        status: arq.status
      }))
    }
  }

  async getInventoryMovementsReport(token: string, filters?: ReportFilters): Promise<InventoryMovementsReport> {
    const params = this.buildQueryParams(filters)
    const response = await apiFetch(`/reports/inventory-movements?${params}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Error al obtener el reporte de movimientos de inventario')
    }

    const data = await response.json()
    return {
      summary: {
        totalMovements: data.summary?.totalMovements || 0,
        totalIn: Number(data.summary?.totalIn || 0),
        totalOut: Number(data.summary?.totalOut || 0),
        netMovement: Number(data.summary?.netMovement || 0),
        totalCostIn: Number(data.summary?.totalCostIn || 0),
        totalCostOut: Number(data.summary?.totalCostOut || 0),
        movementsByType: data.summary?.movementsByType || {}
      },
      movements: (data.movements || []).map((mov: any) => ({
        id: mov.id,
        productId: mov.productId,
        productVariantId: mov.productVariantId,
        movementType: mov.movementType,
        quantity: Number(mov.quantity || 0),
        quantityBefore: Number(mov.quantityBefore || 0),
        quantityAfter: Number(mov.quantityAfter || 0),
        unitCost: Number(mov.unitCost || 0),
        totalCost: Number(mov.totalCost || 0),
        referenceType: mov.referenceType,
        referenceId: mov.referenceId,
        referenceNumber: mov.referenceNumber,
        batchNumber: mov.batchNumber,
        expiryDate: mov.expiryDate ? new Date(mov.expiryDate) : undefined,
        warehouseId: mov.warehouseId,
        warehouseName: mov.warehouseName,
        notes: mov.notes,
        reason: mov.reason,
        userId: mov.userId,
        createdAt: new Date(mov.createdAt)
      }))
    }
  }

  async downloadReport(
    token: string, 
    reportType: 'sales' | 'products' | 'customers' | 'inventory',
    format: 'csv' | 'pdf' | 'excel',
    filters?: ReportFilters
  ): Promise<Blob> {
    const params = this.buildQueryParams({ ...filters, format })
    const response = await apiFetch(`/reports/${reportType}/download?${params}`, {
      method: 'GET',
      token,
      skipContentType: true
    })
    
    if (!response.ok) {
      throw new Error('Error al descargar el reporte')
    }
    
    return await response.blob()
  }

  async getDailySummary(token: string, date?: Date): Promise<any> {
    const dateParam = date ? `?date=${date.toISOString()}` : ''
    const response = await apiFetch(`/reports/daily-summary${dateParam}`, {
      method: 'GET',
      token,
      skipContentType: true
    })
    
    if (!response.ok) {
      throw new Error('Error al obtener el resumen diario')
    }
    
    return await response.json()
  }

  private buildQueryParams(filters?: ReportFilters): string {
    if (!filters) return ''
    
    const params = new URLSearchParams()
    
    if (filters.startDate) {
      params.append('startDate', filters.startDate.toISOString())
    }
    
    if (filters.endDate) {
      params.append('endDate', filters.endDate.toISOString())
    }
    
    if (filters.paymentMethod) {
      params.append('paymentMethod', filters.paymentMethod)
    }
    
    if (filters.customerId) {
      params.append('customerId', filters.customerId)
    }
    
    if (filters.productId) {
      params.append('productId', filters.productId)
    }
    
    if (filters.format) {
      params.append('format', filters.format)
    }
    
    return params.toString()
  }
}

export const reportsService = new ReportsService()







