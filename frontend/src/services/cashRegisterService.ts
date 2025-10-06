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

      // Check if response has content before parsing
      const text = await response.text()
      console.log('🔍 Response text from /current:', text)

      if (!text || text === 'null' || text.trim() === '') {
        console.log('⚠️ Response is empty or null')
        return null
      }

      const data = JSON.parse(text)
      console.log('📦 Parsed data from /current:', data)

      // Check if backend returned a message object (no session)
      if (!data || data === null || (data.message && !data.id)) {
        console.log('⚠️ No valid session data')
        return null
      }

      const mapped = this.mapBackendRegister(data)
      console.log('✅ Mapped register:', mapped)
      return mapped
    } catch (error) {
      console.error('Error fetching current register:', error)
      // Return null instead of throwing on parse errors
      if (error instanceof SyntaxError) {
        return null
      }
      throw error
    }
  }

  async openRegister(data: OpenRegisterDto, token: string): Promise<CashRegister> {
    // Map openingAmount to openingBalance for backend
    const payload = {
      openingBalance: data.openingAmount,
      openingNotes: data.notes
    }

    const response = await apiFetch('/cash-register/open', {
      method: 'POST',
      body: JSON.stringify(payload),
      token
    })

    if (!response.ok) {
      let errorMessage = 'Error al abrir la caja'

      try {
        const error = await response.json()
        errorMessage = error.message || errorMessage

        // Translate common backend messages
        if (errorMessage.includes('already have an open cash register')) {
          errorMessage = 'Ya tienes una sesión de caja abierta. Por favor ciérrala antes de abrir una nueva.'
        }
      } catch (e) {
        // If response is not JSON, use status code
        if (response.status === 409) {
          errorMessage = 'Ya existe una caja abierta'
        }
      }

      throw new Error(errorMessage)
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

  async getRegisterSummary(token: string): Promise<RegisterSummary | null> {
    const response = await apiFetch('/cash-register/summary', {
      method: 'GET',
      token,
      skipContentType: true
    })

    if (!response.ok) {
      throw new Error('Error al obtener el resumen de caja')
    }

    // Check if response has content before parsing
    const text = await response.text()
    if (!text || text === 'null') {
      return null
    }

    const summary = JSON.parse(text)

    // If no summary (no open register), return null
    if (!summary || summary === null) {
      return null
    }

    return {
      ...summary,
      openingDate: new Date(summary.openedAt || summary.openingDate),
      closingDate: summary.closedAt ? new Date(summary.closedAt) : (summary.closingDate ? new Date(summary.closingDate) : undefined),
      openingAmount: summary.openingBalance || summary.openingAmount || 0,
      expectedAmount: summary.currentBalance || summary.expectedAmount || 0
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
      openingDate: new Date(data.openedAt || data.openingDate),
      openingAmount: Number(data.openingBalance || data.openingAmount || 0),
      expectedAmount: data.expectedBalance || data.expectedAmount || data.currentBalance,
      actualAmount: data.actualBalance || data.actualAmount,
      difference: data.difference,
      status: data.status as RegisterStatus,
      closingDate: data.closedAt ? new Date(data.closedAt) : (data.closingDate ? new Date(data.closingDate) : undefined),
      openedBy: data.openedBy || data.userId,
      closedBy: data.closedBy,
      sales: data.sales || [],
      expenses: data.expenses ? data.expenses.map((e: any) => this.mapBackendExpense(e)) : [],
      notes: data.openingNotes || data.closingNotes || data.notes
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
