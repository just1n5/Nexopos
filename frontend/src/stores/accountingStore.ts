import { create } from 'zustand';
import {
  DashboardData,
  Expense,
  CreateExpenseDto,
  ExpenseStats,
  IVAReport,
  ProfitAndLoss,
  BalanceSheet,
  ExpensesByCategory,
  FiscalConfig,
  FiscalSummary,
  JournalEntry
} from '../types/accounting';
import accountingService from '../services/accountingService';
import { useAuthStore } from './authStore';

interface AccountingState {
  // Dashboard
  dashboardData: DashboardData | null;
  dashboardLoading: boolean;
  dashboardError: string | null;

  // Gastos
  expenses: Expense[];
  expensesLoading: boolean;
  expensesError: string | null;
  selectedExpense: Expense | null;

  // Estadísticas de gastos
  expenseStats: ExpenseStats | null;
  expenseStatsLoading: boolean;

  // Reportes
  ivaReport: IVAReport | null;
  profitAndLoss: ProfitAndLoss | null;
  balanceSheet: BalanceSheet | null;
  expensesByCategory: ExpensesByCategory | null;
  reportsLoading: boolean;
  reportsError: string | null;

  // Configuración Fiscal
  fiscalConfig: FiscalConfig | null;
  fiscalSummary: FiscalSummary | null;
  fiscalConfigLoading: boolean;
  fiscalConfigError: string | null;

  // Asientos Contables
  journalEntries: JournalEntry[];
  journalEntriesLoading: boolean;

  // Acciones
  loadDashboard: (token: string, month?: number, year?: number) => Promise<void>;
  loadExpenses: (token: string, filters?: any) => Promise<void>;
  createExpense: (token: string, expenseData: CreateExpenseDto) => Promise<Expense>;
  updateExpense: (token: string, id: string, updateData: Partial<CreateExpenseDto>) => Promise<Expense>;
  markExpenseAsPaid: (token: string, id: string, paymentDate?: string) => Promise<void>;
  cancelExpense: (token: string, id: string) => Promise<void>;
  loadExpenseStats: (token: string, startDate: string, endDate: string) => Promise<void>;
  setSelectedExpense: (expense: Expense | null) => void;
  loadIVAReport: (token: string, startDate: string, endDate: string) => Promise<void>;
  loadProfitAndLoss: (token: string, startDate: string, endDate: string) => Promise<void>;
  loadBalanceSheet: (token: string, date?: string) => Promise<void>;
  loadExpensesByCategory: (token: string, startDate: string, endDate: string) => Promise<void>;
  loadFiscalConfig: (token: string) => Promise<void>;
  saveFiscalConfig: (token: string, config: FiscalConfig) => Promise<void>;
  loadFiscalSummary: (token: string) => Promise<void>;
  loadJournalEntries: (token: string, filters?: any) => Promise<void>;
  reset: () => void;
}

const getAuthToken = () => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('No auth token found');
  return token;
};

export const useAccountingStore = create<AccountingState>((set) => ({
  // Estado inicial
  dashboardData: null,
  dashboardLoading: false,
  dashboardError: null,
  expenses: [],
  expensesLoading: false,
  expensesError: null,
  selectedExpense: null,
  expenseStats: null,
  expenseStatsLoading: false,
  ivaReport: null,
  profitAndLoss: null,
  balanceSheet: null,
  expensesByCategory: null,
  reportsLoading: false,
  reportsError: null,
  fiscalConfig: null,
  fiscalSummary: null,
  fiscalConfigLoading: false,
  fiscalConfigError: null,
  journalEntries: [],
  journalEntriesLoading: false,

  // Acciones
  loadDashboard: async (token, month, year) => {
    set({ dashboardLoading: true, dashboardError: null });
    try {
      const data = await accountingService.getDashboard(token, month, year);
      set({ dashboardData: data, dashboardLoading: false });
    } catch (error: any) {
      set({ dashboardError: error.message, dashboardLoading: false });
    }
  },

  loadExpenses: async (token, filters) => {
    set({ expensesLoading: true, expensesError: null });
    try {
      const expenses = await accountingService.getExpenses(token, filters);
      set({ expenses, expensesLoading: false });
    } catch (error: any) {
      set({ expensesError: error.message, expensesLoading: false });
    }
  },

  createExpense: async (token, expenseData) => {
    const newExpense = await accountingService.createExpense(token, expenseData);
    set(state => ({ expenses: [newExpense, ...state.expenses] }));
    return newExpense;
  },

  updateExpense: async (token, id, updateData) => {
    const updatedExpense = await accountingService.updateExpense(token, id, updateData);
    set(state => ({ expenses: state.expenses.map(e => e.id === id ? updatedExpense : e) }));
    return updatedExpense;
  },

  markExpenseAsPaid: async (token, id, paymentDate) => {
    const updatedExpense = await accountingService.markExpenseAsPaid(token, id, paymentDate);
    set(state => ({ expenses: state.expenses.map(e => e.id === id ? updatedExpense : e) }));
  },

  cancelExpense: async (token, id) => {
    await accountingService.cancelExpense(token, id);
    set(state => ({ expenses: state.expenses.filter(e => e.id !== id) }));
  },

  loadExpenseStats: async (token, startDate, endDate) => {
    set({ expenseStatsLoading: true });
    try {
      const stats = await accountingService.getExpenseStats(token, startDate, endDate);
      set({ expenseStats: stats, expenseStatsLoading: false });
    } catch (error: any) {
      set({ expenseStatsLoading: false });
    }
  },

  setSelectedExpense: (expense) => set({ selectedExpense: expense }),

  loadIVAReport: async (token, startDate, endDate) => {
    set({ reportsLoading: true, reportsError: null });
    try {
      const report = await accountingService.getIVAReport(token, startDate, endDate);
      set({ ivaReport: report, reportsLoading: false });
    } catch (error: any) {
      set({ reportsError: error.message, reportsLoading: false });
    }
  },

  loadProfitAndLoss: async (token, startDate, endDate) => {
    set({ reportsLoading: true, reportsError: null });
    try {
      const report = await accountingService.getProfitAndLoss(token, startDate, endDate);
      set({ profitAndLoss: report, reportsLoading: false });
    } catch (error: any) {
      set({ reportsError: error.message, reportsLoading: false });
    }
  },

  loadBalanceSheet: async (token, date) => {
    set({ reportsLoading: true, reportsError: null });
    try {
      const report = await accountingService.getBalanceSheet(token, date);
      set({ balanceSheet: report, reportsLoading: false });
    } catch (error: any) {
      set({ reportsError: error.message, reportsLoading: false });
    }
  },

  loadExpensesByCategory: async (token, startDate, endDate) => {
    set({ reportsLoading: true, reportsError: null });
    try {
      const report = await accountingService.getExpensesByCategory(token, startDate, endDate);
      set({ expensesByCategory: report, reportsLoading: false });
    } catch (error: any) {
      set({ reportsError: error.message, reportsLoading: false });
    }
  },

  loadFiscalConfig: async (token) => {
    set({ fiscalConfigLoading: true, fiscalConfigError: null });
    try {
      const config = await accountingService.getFiscalConfig(token);
      set({ fiscalConfig: config, fiscalConfigLoading: false });
    } catch (error: any) {
      set({ fiscalConfigError: error.message, fiscalConfigLoading: false });
    }
  },

  saveFiscalConfig: async (token, config) => {
    set({ fiscalConfigLoading: true, fiscalConfigError: null });
    const savedConfig = await accountingService.saveFiscalConfig(token, config);
    set({ fiscalConfig: savedConfig, fiscalConfigLoading: false });
  },

  loadFiscalSummary: async (token) => {
    const summary = await accountingService.getFiscalSummary(token);
    set({ fiscalSummary: summary });
  },

  loadJournalEntries: async (token, filters) => {
    set({ journalEntriesLoading: true });
    try {
      const entries = await accountingService.getJournalEntries(token, filters);
      set({ journalEntries: entries, journalEntriesLoading: false });
    } catch (error: any) {
      set({ journalEntriesLoading: false });
    }
  },

  reset: () => set({ ... }), // Reset logic remains the same
}));