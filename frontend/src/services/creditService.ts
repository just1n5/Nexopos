import { apiFetch } from '@/lib/api'
import type { Sale, Customer } from '@/types'

export interface CreditSale {
  id: string
  saleId: string
  customerId: string
  customer?: Customer
  totalAmount: number
  paidAmount: number
  remainingBalance: number
  dueDate?: Date
  status: 'pending' | 'paid' | 'overdue'
  payments: CreditPayment[]
  sale?: Sale
  createdAt: Date
  updatedAt: Date
}

export interface CreditPayment {
  id: string
  creditSaleId: string
  amount: number
  paymentMethod: 'cash' | 'transfer' | 'card' | 'other'
  date: Date
  notes?: string
  receivedBy?: string
}

export interface CreateCreditPaymentDto {
  amount: number
  paymentMethod: 'cash' | 'transfer' | 'card' | 'other'
  notes?: string
}

export interface CreditSummary {
  totalCredits: number
  totalPending: number
  totalOverdue: number
  creditsCount: number
  pendingCount: number
  overdueCount: number
}

class CreditService {
  async getCreditSales(token: string, params?: {
    customerId?: string
    status?: 'pending' | 'paid' | 'overdue'
    startDate?: Date
    endDate?: Date
  }): Promise<CreditSale[]> {
    const queryParams = new URLSearchParams()
    if (params?.customerId) queryParams.append('customerId', params.customerId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.startDate) queryParams.append('startDate', params.startDate.toISOString())
    if (params?.endDate) queryParams.append('endDate', params.endDate.toISOString())

    const response = await apiFetch(`/credits?${queryParams.toString()}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Error al obtener las ventas a crédito')
    }

    const data = await response.json()
    return data.map((item: any) => this.mapBackendCreditSale(item))
  }

  async getCreditSaleById(id: string, token: string): Promise<CreditSale> {
    const response = await apiFetch(`/credits/${id}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Error al obtener la venta a crédito')
    }

    const data = await response.json()
    return this.mapBackendCreditSale(data)
  }

  async addPayment(creditSaleId: string, payment: CreateCreditPaymentDto, token: string): Promise<CreditPayment> {
    const response = await apiFetch(`/credits/${creditSaleId}/payments`, {
      method: 'POST',
      body: JSON.stringify(payment),
      token
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al registrar el pago')
    }

    const data = await response.json()
    return this.mapBackendCreditPayment(data)
  }

  async getPaymentHistory(creditSaleId: string, token: string): Promise<CreditPayment[]> {
    const response = await apiFetch(`/credits/${creditSaleId}/payments`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Error al obtener el historial de pagos')
    }

    const data = await response.json()
    return data.map((item: any) => this.mapBackendCreditPayment(item))
  }

  async getCreditSummary(token: string): Promise<CreditSummary> {
    const response = await apiFetch('/credits/summary', {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Error al obtener el resumen de créditos')
    }

    const data = await response.json()
    return {
      totalCredits: Number(data.totalCredits || 0),
      totalPending: Number(data.totalPending || 0),
      totalOverdue: Number(data.totalOverdue || 0),
      creditsCount: Number(data.creditsCount || 0),
      pendingCount: Number(data.pendingCount || 0),
      overdueCount: Number(data.overdueCount || 0)
    }
  }

  async sendPaymentReminder(creditSaleId: string, method: 'whatsapp' | 'sms' | 'email', token: string): Promise<void> {
    const response = await apiFetch(`/credits/${creditSaleId}/reminder`, {
      method: 'POST',
      body: JSON.stringify({ method }),
      token
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al enviar el recordatorio')
    }
  }

  private mapBackendCreditSale(data: any): CreditSale {
    return {
      id: data.id,
      saleId: data.saleId,
      customerId: data.customerId,
      customer: data.customer,
      totalAmount: Number(data.totalAmount || 0),
      paidAmount: Number(data.paidAmount || 0),
      remainingBalance: Number(data.remainingBalance || 0),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      status: data.status,
      payments: data.payments ? data.payments.map((p: any) => this.mapBackendCreditPayment(p)) : [],
      sale: data.sale,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    }
  }

  private mapBackendCreditPayment(data: any): CreditPayment {
    return {
      id: data.id,
      creditSaleId: data.creditSaleId,
      amount: Number(data.amount || 0),
      paymentMethod: data.paymentMethod,
      date: new Date(data.date || data.createdAt),
      notes: data.notes,
      receivedBy: data.receivedBy
    }
  }
}

export const creditService = new CreditService()
