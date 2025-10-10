import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { cashRegisterService, type RegisterSummary, type AddExpenseDto, type OpenRegisterDto, type CloseRegisterDto } from '@/services/cashRegisterService';
import type { CashRegister, Expense } from '@/types';

interface CashRegisterState {
  summary: RegisterSummary | null;
  currentRegister: CashRegister | null;
  expenses: Expense[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchCurrentData: (token: string) => Promise<void>;
  openRegister: (data: OpenRegisterDto, token: string) => Promise<void>;
  closeRegister: (data: CloseRegisterDto, token: string) => Promise<void>;
  addExpense: (data: AddExpenseDto, token: string) => Promise<void>;
  refreshSummary: (token: string) => Promise<void>;
}

export const useCashRegisterStore = create<CashRegisterState>()(
  devtools(
    (set, get) => ({
      summary: null,
      currentRegister: null,
      expenses: [],
      loading: false,
      error: null,

      // Fetches all essential data for the cash register view
      fetchCurrentData: async (token: string) => {
        try {
          set({ loading: true, error: null });
          console.log('[CashRegisterStore] Fetching current data...');

          const register = await cashRegisterService.getCurrentRegister(token);
          set({ currentRegister: register });
          console.log('[CashRegisterStore] Current register fetched:', register);

          if (register) {
            const [summary, expenses] = await Promise.all([
              cashRegisterService.getRegisterSummary(token),
              cashRegisterService.getTodayExpenses(token),
            ]);
            set({ summary, expenses });
            console.log('[CashRegisterStore] Summary and expenses fetched:', { summary, expenses });
          } else {
            // If there is no open register, clear the summary and expenses
            set({ summary: null, expenses: [] });
          }
        } catch (e: any) {
          const errorMessage = e.message || 'Error al cargar los datos de la caja';
          set({ error: errorMessage });
          console.error('[CashRegisterStore] Error fetching data:', errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      // Refreshes only the summary
      refreshSummary: async (token: string) => {
        try {
          console.log('[CashRegisterStore] Refreshing summary...');
          const summary = await cashRegisterService.getRegisterSummary(token);
          set({ summary });
          console.log('[CashRegisterStore] Summary refreshed:', summary);
        } catch (e: any) {
          const errorMessage = e.message || 'Error al refrescar el resumen de caja';
          set({ error: errorMessage });
          console.error('[CashRegisterStore] Error refreshing summary:', errorMessage);
        }
      },

      // Opens a new register
      openRegister: async (data: OpenRegisterDto, token: string) => {
        try {
          set({ loading: true, error: null });
          await cashRegisterService.openRegister(data, token);
          console.log('[CashRegisterStore] Register opened successfully.');
          // After opening, fetch all data
          await get().fetchCurrentData(token);
        } catch (e: any) {
          const errorMessage = e.message || 'No se pudo abrir la caja';
          set({ error: errorMessage, loading: false });
          console.error('[CashRegisterStore] Error opening register:', errorMessage);
          throw new Error(errorMessage); // Re-throw to be caught in the component
        }
      },

      // Closes the current register
      closeRegister: async (data: CloseRegisterDto, token: string) => {
        try {
          set({ loading: true, error: null });
          await cashRegisterService.closeRegister(data, token);
          console.log('[CashRegisterStore] Register closed successfully.');
          // After closing, clear the state
          set({ currentRegister: null, summary: null, expenses: [], loading: false });
        } catch (e: any) {
          const errorMessage = e.message || 'No se pudo cerrar la caja';
          set({ error: errorMessage, loading: false });
          console.error('[CashRegisterStore] Error closing register:', errorMessage);
          throw new Error(errorMessage); // Re-throw to be caught in the component
        }
      },

      // Adds a new expense
      addExpense: async (data: AddExpenseDto, token: string) => {
        try {
          // Don't set loading for this, it's a quick action
          await cashRegisterService.addExpense(data, token);
          console.log('[CashRegisterStore] Expense added successfully.');
          // After adding, refresh summary and expenses
          const [summary, expenses] = await Promise.all([
            cashRegisterService.getRegisterSummary(token),
            cashRegisterService.getTodayExpenses(token),
          ]);
          set({ summary, expenses });
        } catch (e: any) {
          const errorMessage = e.message || 'No se pudo registrar el gasto';
          set({ error: errorMessage });
          console.error('[CashRegisterStore] Error adding expense:', errorMessage);
          throw new Error(errorMessage); // Re-throw to be caught in the component
        }
      },
    }),
    {
      name: 'cash-register-storage',
    }
  )
);