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

export interface SalesReport {
  totalSales: number
  totalRevenue: number
  averageTicket: number
  salesByPaymentMethod: Record<string, number>
  salesByHour: Record<number, number>
  creditSales: number
  creditPending: number
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

class ReportsService {
  async getSalesReport(token: string, filters?: ReportFilters): Promise<SalesReport> {
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
      totalRevenue: Number(data.totalRevenue || 0),
      averageTicket: Number(data.averageTicket || 0),
      salesByPaymentMethod: data.salesByPaymentMethod || {},
      salesByHour: data.salesByHour || {},
      creditSales: Number(data.creditSales || 0),
      creditPending: Number(data.creditPending || 0)
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







