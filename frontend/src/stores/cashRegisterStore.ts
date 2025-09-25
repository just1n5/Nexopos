import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { RegisterStatus, PaymentMethod, type CashRegister, type Sale, type Expense } from '@/types'
import { generateId } from '@/lib/utils'

interface CashRegisterState {
  currentRegister: CashRegister | null
  registers: CashRegister[]
  expenses: Expense[]
  
  // Actions
  openRegister: (openingAmount: number, userId: string) => void
  closeRegister: (actualAmount: number, userId: string) => void
  addSale: (sale: Sale) => void
  addExpense: (expense: Omit<Expense, 'id'>) => void
  
  // Calculations
  getTodaySales: () => Sale[]
  getTodayExpenses: () => Expense[]
  getExpectedCash: () => number
  getSalesByPaymentMethod: () => Record<PaymentMethod, number>
  getDifference: (actualAmount: number) => number
}

export const useCashRegisterStore = create<CashRegisterState>()(
  devtools(
    persist(
      (set, get) => ({
        currentRegister: null,
        registers: [],
        expenses: [],
        
        // Open register
        openRegister: (openingAmount, userId) => {
          const newRegister: CashRegister = {
            id: generateId(),
            openingDate: new Date(),
            openingAmount,
            sales: [],
            expenses: [],
            status: RegisterStatus.OPEN,
            openedBy: userId
          }
          
          set((state) => ({
            currentRegister: newRegister,
            registers: [...state.registers, newRegister]
          }))
        },
        
        // Close register
        closeRegister: (actualAmount, userId) => {
          const current = get().currentRegister
          if (!current) return
          
          const expectedAmount = get().getExpectedCash()
          const difference = actualAmount - expectedAmount
          
          const closedRegister: CashRegister = {
            ...current,
            closingDate: new Date(),
            expectedAmount,
            actualAmount,
            difference,
            status: RegisterStatus.CLOSED,
            closedBy: userId
          }
          
          set((state) => ({
            currentRegister: null,
            registers: state.registers.map(reg =>
              reg.id === closedRegister.id ? closedRegister : reg
            )
          }))
        },
        
        // Add sale to current register
        addSale: (sale) => {
          const current = get().currentRegister
          if (!current) return
          
          set((state) => ({
            currentRegister: state.currentRegister
              ? {
                  ...state.currentRegister,
                  sales: [...state.currentRegister.sales, sale]
                }
              : null
          }))
        },
        
        // Add expense
        addExpense: (expenseData) => {
          const expense: Expense = {
            ...expenseData,
            id: generateId()
          }
          
          const current = get().currentRegister
          if (current) {
            set((state) => ({
              currentRegister: state.currentRegister
                ? {
                    ...state.currentRegister,
                    expenses: [...state.currentRegister.expenses, expense]
                  }
                : null,
              expenses: [...state.expenses, expense]
            }))
          }
        },
        
        // Get today's sales
        getTodaySales: () => {
          const current = get().currentRegister
          if (!current) return []
          
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          return current.sales.filter(sale => {
            const saleDate = new Date(sale.date)
            saleDate.setHours(0, 0, 0, 0)
            return saleDate.getTime() === today.getTime()
          })
        },
        
        // Get today's expenses
        getTodayExpenses: () => {
          const current = get().currentRegister
          if (!current) return []
          
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          return current.expenses.filter(expense => {
            const expenseDate = new Date(expense.date)
            expenseDate.setHours(0, 0, 0, 0)
            return expenseDate.getTime() === today.getTime()
          })
        },
        
        // Calculate expected cash
        getExpectedCash: () => {
          const current = get().currentRegister
          if (!current) return 0
          
          const cashSales = current.sales
            .filter(sale => sale.primaryPaymentMethod === PaymentMethod.CASH)
            .reduce((sum, sale) => sum + sale.total, 0)
          
          const totalExpenses = current.expenses
            .reduce((sum, expense) => sum + expense.amount, 0)
          
          return current.openingAmount + cashSales - totalExpenses
        },
        
        // Get sales by payment method
        getSalesByPaymentMethod: () => {
          const current = get().currentRegister
          if (!current) {
            return {
              [PaymentMethod.CASH]: 0,
              [PaymentMethod.CARD]: 0,
              [PaymentMethod.NEQUI]: 0,
              [PaymentMethod.DAVIPLATA]: 0,
              [PaymentMethod.CREDIT]: 0,
              [PaymentMethod.BANK_TRANSFER]: 0,
              [PaymentMethod.OTHER]: 0
            }
          }
          
          const result: Record<PaymentMethod, number> = {
            [PaymentMethod.CASH]: 0,
            [PaymentMethod.CARD]: 0,
            [PaymentMethod.NEQUI]: 0,
            [PaymentMethod.DAVIPLATA]: 0,
            [PaymentMethod.CREDIT]: 0,
            [PaymentMethod.BANK_TRANSFER]: 0,
            [PaymentMethod.OTHER]: 0
          }
          
          current.sales.forEach((sale) => {
            const method = sale.primaryPaymentMethod
            if (!method) {
              return
            }
            result[method] += sale.total
          })
          
          return result
        },
        
        // Calculate difference
        getDifference: (actualAmount) => {
          const expectedAmount = get().getExpectedCash()
          return actualAmount - expectedAmount
        }
      }),
      {
        name: 'cash-register-storage',
        partialize: (state) => ({
          currentRegister: state.currentRegister,
          registers: state.registers.slice(-30), // Keep last 30 registers
          expenses: state.expenses.slice(-100) // Keep last 100 expenses
        })
      }
    )
  )
)

