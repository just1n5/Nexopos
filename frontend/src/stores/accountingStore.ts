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

  // Acciones - Dashboard
  loadDashboard: (month?: number, year?: number) => Promise<void>;

  // Acciones - Gastos
  loadExpenses: (filters?: any) => Promise<void>;
  createExpense: (expenseData: CreateExpenseDto) => Promise<Expense>;
  updateExpense: (id: string, updateData: Partial<CreateExpenseDto>) => Promise<Expense>;
  markExpenseAsPaid: (id: string, paymentDate?: string) => Promise<void>;
  cancelExpense: (id: string) => Promise<void>;
  loadExpenseStats: (startDate: string, endDate: string) => Promise<void>;
  setSelectedExpense: (expense: Expense | null) => void;

  // Acciones - Reportes
  loadIVAReport: (startDate: string, endDate: string) => Promise<void>;
  loadProfitAndLoss: (startDate: string, endDate: string) => Promise<void>;
  loadBalanceSheet: (date?: string) => Promise<void>;
  loadExpensesByCategory: (startDate: string, endDate: string) => Promise<void>;

  // Acciones - Configuración Fiscal
  loadFiscalConfig: () => Promise<void>;
  saveFiscalConfig: (config: FiscalConfig) => Promise<void>;
  loadFiscalSummary: () => Promise<void>;

  // Acciones - Asientos Contables
  loadJournalEntries: (filters?: any) => Promise<void>;

  // Reset
  reset: () => void;
}

export const useAccountingStore = create<AccountingState>((set) => ({
  // Estado inicial - Dashboard
  dashboardData: null,
  dashboardLoading: false,
  dashboardError: null,

  // Estado inicial - Gastos
  expenses: [],
  expensesLoading: false,
  expensesError: null,
  selectedExpense: null,

  // Estado inicial - Estadísticas
  expenseStats: null,
  expenseStatsLoading: false,

  // Estado inicial - Reportes
  ivaReport: null,
  profitAndLoss: null,
  balanceSheet: null,
  expensesByCategory: null,
  reportsLoading: false,
  reportsError: null,

  // Estado inicial - Configuración Fiscal
  fiscalConfig: null,
  fiscalSummary: null,
  fiscalConfigLoading: false,
  fiscalConfigError: null,

  // Estado inicial - Asientos Contables
  journalEntries: [],
  journalEntriesLoading: false,

  // ========================================
  // ACCIONES - DASHBOARD
  // ========================================

  loadDashboard: async (month?: number, year?: number) => {
    set({ dashboardLoading: true, dashboardError: null });
    try {
      const data = await accountingService.getDashboard(month, year);
      set({ dashboardData: data, dashboardLoading: false });
    } catch (error: any) {
      set({
        dashboardError: error.message || 'Error al cargar el dashboard',
        dashboardLoading: false
      });
      console.error('Error loading dashboard:', error);
    }
  },

  // ========================================
  // ACCIONES - GASTOS
  // ========================================

  loadExpenses: async (filters?: any) => {
    set({ expensesLoading: true, expensesError: null });
    try {
      const expenses = await accountingService.getExpenses(filters);
      set({ expenses, expensesLoading: false });
    } catch (error: any) {
      set({
        expensesError: error.message || 'Error al cargar los gastos',
        expensesLoading: false
      });
      console.error('Error loading expenses:', error);
    }
  },

  createExpense: async (expenseData: CreateExpenseDto) => {
    try {
      const newExpense = await accountingService.createExpense(expenseData);
      set(state => ({
        expenses: [newExpense, ...state.expenses]
      }));
      return newExpense;
    } catch (error: any) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },

  updateExpense: async (id: string, updateData: Partial<CreateExpenseDto>) => {
    try {
      const updatedExpense = await accountingService.updateExpense(id, updateData);
      set(state => ({
        expenses: state.expenses.map(e => e.id === id ? updatedExpense : e)
      }));
      return updatedExpense;
    } catch (error: any) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  markExpenseAsPaid: async (id: string, paymentDate?: string) => {
    try {
      const updatedExpense = await accountingService.markExpenseAsPaid(id, paymentDate);
      set(state => ({
        expenses: state.expenses.map(e => e.id === id ? updatedExpense : e)
      }));
    } catch (error: any) {
      console.error('Error marking expense as paid:', error);
      throw error;
    }
  },

  cancelExpense: async (id: string) => {
    try {
      await accountingService.cancelExpense(id);
      set(state => ({
        expenses: state.expenses.filter(e => e.id !== id)
      }));
    } catch (error: any) {
      console.error('Error cancelling expense:', error);
      throw error;
    }
  },

  loadExpenseStats: async (startDate: string, endDate: string) => {
    set({ expenseStatsLoading: true });
    try {
      const stats = await accountingService.getExpenseStats(startDate, endDate);
      set({ expenseStats: stats, expenseStatsLoading: false });
    } catch (error: any) {
      set({ expenseStatsLoading: false });
      console.error('Error loading expense stats:', error);
    }
  },

  setSelectedExpense: (expense: Expense | null) => {
    set({ selectedExpense: expense });
  },

  // ========================================
  // ACCIONES - REPORTES
  // ========================================

  loadIVAReport: async (startDate: string, endDate: string) => {
    set({ reportsLoading: true, reportsError: null });
    try {
      const report = await accountingService.getIVAReport(startDate, endDate);
      set({ ivaReport: report, reportsLoading: false });
    } catch (error: any) {
      set({
        reportsError: error.message || 'Error al cargar el reporte de IVA',
        reportsLoading: false
      });
      console.error('Error loading IVA report:', error);
    }
  },

  loadProfitAndLoss: async (startDate: string, endDate: string) => {
    set({ reportsLoading: true, reportsError: null });
    try {
      const report = await accountingService.getProfitAndLoss(startDate, endDate);
      set({ profitAndLoss: report, reportsLoading: false });
    } catch (error: any) {
      set({
        reportsError: error.message || 'Error al cargar el estado de resultados',
        reportsLoading: false
      });
      console.error('Error loading P&L:', error);
    }
  },

  loadBalanceSheet: async (date?: string) => {
    set({ reportsLoading: true, reportsError: null });
    try {
      const report = await accountingService.getBalanceSheet(date);
      set({ balanceSheet: report, reportsLoading: false });
    } catch (error: any) {
      set({
        reportsError: error.message || 'Error al cargar el balance general',
        reportsLoading: false
      });
      console.error('Error loading balance sheet:', error);
    }
  },

  loadExpensesByCategory: async (startDate: string, endDate: string) => {
    set({ reportsLoading: true, reportsError: null });
    try {
      const report = await accountingService.getExpensesByCategory(startDate, endDate);
      set({ expensesByCategory: report, reportsLoading: false });
    } catch (error: any) {
      set({
        reportsError: error.message || 'Error al cargar los gastos por categoría',
        reportsLoading: false
      });
      console.error('Error loading expenses by category:', error);
    }
  },

  // ========================================
  // ACCIONES - CONFIGURACIÓN FISCAL
  // ========================================

  loadFiscalConfig: async () => {
    set({ fiscalConfigLoading: true, fiscalConfigError: null });
    try {
      const config = await accountingService.getFiscalConfig();
      set({ fiscalConfig: config, fiscalConfigLoading: false });
    } catch (error: any) {
      set({
        fiscalConfigError: error.message || 'Error al cargar la configuración fiscal',
        fiscalConfigLoading: false
      });
      console.error('Error loading fiscal config:', error);
    }
  },

  saveFiscalConfig: async (config: FiscalConfig) => {
    set({ fiscalConfigLoading: true, fiscalConfigError: null });
    try {
      const savedConfig = await accountingService.saveFiscalConfig(config);
      set({ fiscalConfig: savedConfig, fiscalConfigLoading: false });
    } catch (error: any) {
      set({
        fiscalConfigError: error.message || 'Error al guardar la configuración fiscal',
        fiscalConfigLoading: false
      });
      console.error('Error saving fiscal config:', error);
      throw error;
    }
  },

  loadFiscalSummary: async () => {
    try {
      const summary = await accountingService.getFiscalSummary();
      set({ fiscalSummary: summary });
    } catch (error: any) {
      console.error('Error loading fiscal summary:', error);
    }
  },

  // ========================================
  // ACCIONES - ASIENTOS CONTABLES
  // ========================================

  loadJournalEntries: async (filters?: any) => {
    set({ journalEntriesLoading: true });
    try {
      const entries = await accountingService.getJournalEntries(filters);
      set({ journalEntries: entries, journalEntriesLoading: false });
    } catch (error: any) {
      set({ journalEntriesLoading: false });
      console.error('Error loading journal entries:', error);
    }
  },

  // ========================================
  // RESET
  // ========================================

  reset: () => {
    set({
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
      journalEntriesLoading: false
    });
  }
}));
