import { apiFetch } from '@/lib/api'
import type { CashRegister, RegisterStatus, Expense } from '@/types'

export interface OpenRegisterDto {
  openingAmount: number
  notes?: string
}

export interface CloseRegisterDto {
  actualAmount: number
  notes?: string
}

export interface AddExpenseDto {
  amount: number
  description: string
  category: string
  notes?: string
}

export interface RegisterSummary {
  id: string
  openingDate: Date
  openingAmount: number
  totalSales: number
  salesByPaymentMethod: Record<string, number>
  totalExpenses: number
  expectedAmount: number
  actualAmount?: number
  difference?: number
  status: RegisterStatus
  closingDate?: Date
}

class CashRegisterService {
  async getCurrentRegister(token: string): Promise<CashRegister | null> {
    try {
      const response = await apiFetch('/cash-register/current', {
        method: 'GET',
        token,
        skipContentType: true
      })
      
      if (response.status === 404) {
        return null
      }
      
      if (!response.ok) {
        throw new Error('Error al obtener el estado de la caja')
      }
      
      const data = await response.json()
      return this.mapBackendRegister(data)
    } catch (error) {
      console.error('Error fetching current register:', error)
      throw error
    }
  }

  async openRegister(data: OpenRegisterDto, token: string): Promise<CashRegister> {
    const response = await apiFetch('/cash-register/open', {
      method: 'POST',
      body: JSON.stringify(data),
      token
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al abrir la caja')
    }
    
    const registerData = await response.json()
    return this.mapBackendRegister(registerData)
  }

  async closeRegister(data: CloseRegisterDto, token: string): Promise<CashRegister> {
    const response = await apiFetch('/cash-register/close', {
      method: 'POST',
      body: JSON.stringify(data),
      token
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al cerrar la caja')
    }
    
    const registerData = await response.json()
    return this.mapBackendRegister(registerData)
  }

  async addExpense(data: AddExpenseDto, token: string): Promise<Expense> {
    const response = await apiFetch('/cash-register/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
      token
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al agregar el gasto')
    }
    
    const expense = await response.json()
    return this.mapBackendExpense(expense)
  }

  async getTodayExpenses(token: string): Promise<Expense[]> {
    const response = await apiFetch('/cash-register/expenses/today', {
      method: 'GET',
      token,
      skipContentType: true
    })
    
    if (!response.ok) {
      throw new Error('Error al obtener los gastos del día')
    }
    
    const expenses = await response.json()
    return expenses.map((e: any) => this.mapBackendExpense(e))
  }

  async getRegisterSummary(token: string): Promise<RegisterSummary> {
    const response = await apiFetch('/cash-register/summary', {
      method: 'GET',
      token,
      skipContentType: true
    })
    
    if (!response.ok) {
      throw new Error('Error al obtener el resumen de caja')
    }
    
    const summary = await response.json()
    return {
      ...summary,
      openingDate: new Date(summary.openingDate),
      closingDate: summary.closingDate ? new Date(summary.closingDate) : undefined
    }
  }

  async getRegisterHistory(token: string, days = 30): Promise<CashRegister[]> {
    const response = await apiFetch(`/cash-register/history?days=${days}`, {
      method: 'GET',
      token,
      skipContentType: true
    })
    
    if (!response.ok) {
      throw new Error('Error al obtener el historial de cajas')
    }
    
    const registers = await response.json()
    return registers.map((r: any) => this.mapBackendRegister(r))
  }

  private mapBackendRegister(data: any): CashRegister {
    return {
      id: data.id,
      openingDate: new Date(data.openingDate),
      openingAmount: Number(data.openingAmount || 0),
      expectedAmount: data.expectedAmount ? Number(data.expectedAmount) : undefined,
      actualAmount: data.actualAmount ? Number(data.actualAmount) : undefined,
      difference: data.difference ? Number(data.difference) : undefined,
      status: data.status as RegisterStatus,
      closingDate: data.closingDate ? new Date(data.closingDate) : undefined,
      openedBy: data.openedBy,
      closedBy: data.closedBy,
      sales: data.sales || [],
      expenses: data.expenses ? data.expenses.map((e: any) => this.mapBackendExpense(e)) : [],
      notes: data.notes
    }
  }

  private mapBackendExpense(data: any): Expense {
    return {
      id: data.id,
      amount: Number(data.amount || 0),
      description: data.description,
      category: data.category || 'other',
      date: new Date(data.date || data.createdAt),
      notes: data.notes,
      createdBy: data.createdBy
    }
  }
}

export const cashRegisterService = new CashRegisterService()
