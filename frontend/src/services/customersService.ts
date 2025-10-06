import { apiFetch } from '@/lib/api'
import type { Customer } from '@/types'

export interface CreateCustomerDto {
  type?: 'individual' | 'business'
  documentType?: string
  documentNumber?: string
  firstName?: string
  lastName?: string
  businessName?: string
  email?: string
  phone?: string
  mobile?: string
  address?: string
  city?: string
  creditEnabled?: boolean
  creditLimit?: number
  creditDays?: number
  notes?: string
}

type ApiCustomer = {
  id: string
  type: 'individual' | 'business'
  documentType: string
  documentNumber: string
  firstName?: string | null
  lastName?: string | null
  businessName?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  address?: string | null
  city?: string | null
  creditEnabled?: boolean | null
  creditLimit?: number | string | null
  creditAvailable?: number | string | null
  creditUsed?: number | string | null
  balance?: number | string | null
  createdAt?: string | null
  updatedAt?: string | null
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

const buildCustomerName = (payload: ApiCustomer): string => {
  if (payload.type === 'business') {
    return payload.businessName || payload.firstName || payload.lastName || 'Cliente'
  }

  return `${payload.firstName ?? ''} ${payload.lastName ?? ''}`.trim() || 'Cliente'
}

const mapCustomer = (payload: ApiCustomer): Customer => ({
  id: payload.id,
  name: buildCustomerName(payload),
  document: payload.documentNumber,
  phone: payload.mobile ?? payload.phone ?? '',
  email: payload.email ?? undefined,
  address: payload.address ?? undefined,
  creditEnabled: payload.creditEnabled ?? false,
  creditLimit: toNumber(payload.creditLimit),
  creditAvailable: toNumber(payload.creditAvailable),
  creditUsed: toNumber(payload.creditUsed),
  currentDebt: toNumber(payload.balance ?? payload.creditUsed),
  createdAt: toDate(payload.createdAt),
  updatedAt: toDate(payload.updatedAt)
})

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

class CustomersService {
  async getCustomers(token: string): Promise<Customer[]> {
    const response = await apiFetch('/customers', {
      method: 'GET',
      token,
      skipContentType: true
    })

    const payload = await parseResponse<ApiCustomer[]>(response, 'Error al obtener los clientes')
    return payload.map(mapCustomer)
  }

  async getCustomerById(id: string, token: string): Promise<Customer> {
    const response = await apiFetch(`/customers/${id}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    const payload = await parseResponse<ApiCustomer>(response, 'Error al obtener el cliente')
    return mapCustomer(payload)
  }

  async createCustomer(customerData: CreateCustomerDto, token: string): Promise<Customer> {
    const response = await apiFetch('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
      token
    })

    const payload = await parseResponse<ApiCustomer>(response, 'Error al crear el cliente')
    return mapCustomer(payload)
  }

  async updateCustomer(id: string, customerData: Partial<CreateCustomerDto>, token: string): Promise<Customer> {
    const response = await apiFetch(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(customerData),
      token
    })

    const payload = await parseResponse<ApiCustomer>(response, 'Error al actualizar el cliente')
    return mapCustomer(payload)
  }

  async deleteCustomer(id: string, token: string): Promise<void> {
    const response = await apiFetch(`/customers/${id}`, {
      method: 'DELETE',
      token
    })

    await parseResponse(response, 'Error al eliminar el cliente')
  }

  async searchCustomers(query: string, token: string): Promise<Customer[]> {
    const response = await apiFetch(`/customers/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    const payload = await parseResponse<ApiCustomer[]>(response, 'Error al buscar clientes')
    return payload.map(mapCustomer)
  }

  async getCustomerBalance(id: string, token: string): Promise<{
    creditLimit: number
    currentDebt: number
    availableCredit: number
  }> {
    const response = await apiFetch(`/customers/${id}/balance`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    const payload = await parseResponse<{ creditLimit?: number | string; creditUsed?: number | string; creditAvailable?: number | string }>(
      response,
      'Error al obtener el saldo del cliente'
    )

    const creditLimit = toNumber(payload.creditLimit)
    const currentDebt = toNumber(payload.creditUsed)
    const availableCredit = toNumber(payload.creditAvailable, creditLimit - currentDebt)

    return { creditLimit, currentDebt, availableCredit }
  }

  async getCustomerPurchaseHistory(id: string, token: string) {
    const response = await apiFetch(`/customers/${id}/purchases`, {
      method: 'GET',
      token,
      skipContentType: true
    })

    return parseResponse(response, 'Error al obtener el historial de compras')
  }

  async recordPayment(customerId: string, amount: number, token: string) {
    const response = await apiFetch(`/customers/${customerId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
      token
    })

    return parseResponse(response, 'Error al registrar el pago')
  }
}

export const customersService = new CustomersService()
