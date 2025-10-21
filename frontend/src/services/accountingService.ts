import axios from 'axios';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Servicio de API para el módulo de Contabilidad
 *
 * Todos los endpoints apuntan a /api/accounting/*
 */

// ========================================
// DASHBOARD Y REPORTES
// ========================================

export const getDashboard = async (token: string, month?: number, year?: number): Promise<DashboardData> => {
  const params = new URLSearchParams();
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());

  const response = await axios.get(`${API_URL}/accounting/dashboard?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getIVAReport = async (token: string, startDate: string, endDate: string): Promise<IVAReport> => {
  const response = await axios.get(`${API_URL}/accounting/reports/iva`, {
    params: { startDate, endDate },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getProfitAndLoss = async (token: string, startDate: string, endDate: string): Promise<ProfitAndLoss> => {
  const response = await axios.get(`${API_URL}/accounting/reports/profit-loss`, {
    params: { startDate, endDate },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getBalanceSheet = async (token: string, date?: string): Promise<BalanceSheet> => {
  const response = await axios.get(`${API_URL}/accounting/reports/balance-sheet`, {
    params: date ? { date } : {},
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getExpensesByCategory = async (
  token: string,
  startDate: string,
  endDate: string
): Promise<ExpensesByCategory> => {
  const response = await axios.get(`${API_URL}/accounting/reports/expenses-by-category`, {
    params: { startDate, endDate },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ========================================
// EXPORTACIÓN DE REPORTES A EXCEL
// ========================================

/**
 * Descarga el reporte de IVA en formato Excel
 * Devuelve un Blob que puede ser descargado directamente
 */
export const exportIVAReportToExcel = async (
  token: string,
  startDate: string,
  endDate: string
): Promise<Blob> => {
  const response = await axios.get(`${API_URL}/accounting/reports/iva/export`, {
    params: { startDate, endDate },
    responseType: 'blob', // Importante: indica que esperamos un archivo binario
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

/**
 * Descarga el estado de resultados (P&L) en formato Excel
 * Devuelve un Blob que puede ser descargado directamente
 */
export const exportProfitAndLossToExcel = async (
  token: string,
  startDate: string,
  endDate: string
): Promise<Blob> => {
  const response = await axios.get(`${API_URL}/accounting/reports/profit-loss/export`, {
    params: { startDate, endDate },
    responseType: 'blob', // Importante: indica que esperamos un archivo binario
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

/**
 * Descarga el Balance General en formato Excel
 * Devuelve un Blob que puede ser descargado directamente
 */
export const exportBalanceSheetToExcel = async (
  token: string,
  date?: string
): Promise<Blob> => {
  const params = date ? { date } : {};
  const response = await axios.get(`${API_URL}/accounting/reports/balance-sheet/export`, {
    params,
    responseType: 'blob', // Importante: indica que esperamos un archivo binario
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

/**
 * Helper function para descargar un Blob como archivo
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ========================================
// GASTOS
// ========================================

export const createExpense = async (token: string, expenseData: CreateExpenseDto): Promise<Expense> => {
  const response = await axios.post(`${API_URL}/accounting/expenses`, expenseData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getExpenses = async (token: string, filters?: {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Expense[]> => {
  const response = await axios.get(`${API_URL}/accounting/expenses`, {
    params: filters,
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getExpense = async (token: string, id: string): Promise<Expense> => {
  const response = await axios.get(`${API_URL}/accounting/expenses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateExpense = async (
  token: string,
  id: string,
  updateData: Partial<CreateExpenseDto>
): Promise<Expense> => {
  const response = await axios.put(`${API_URL}/accounting/expenses/${id}`, updateData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const markExpenseAsPaid = async (
  token: string,
  id: string,
  paymentDate?: string
): Promise<Expense> => {
  const response = await axios.post(`${API_URL}/accounting/expenses/${id}/mark-paid`, {
    paymentDate
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const cancelExpense = async (token: string, id: string): Promise<void> => {
  await axios.delete(`${API_URL}/accounting/expenses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getExpenseStats = async (
  token: string,
  startDate: string,
  endDate: string
): Promise<ExpenseStats> => {
  const response = await axios.get(`${API_URL}/accounting/expenses-stats`, {
    params: { startDate, endDate },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ========================================
// CONFIGURACIÓN FISCAL
// ========================================

export const getFiscalConfig = async (token: string): Promise<FiscalConfig | null> => {
  const response = await axios.get(`${API_URL}/accounting/fiscal-config`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const saveFiscalConfig = async (token: string, config: FiscalConfig): Promise<FiscalConfig> => {
  const response = await axios.put(`${API_URL}/accounting/fiscal-config`, config, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getFiscalSummary = async (token: string): Promise<FiscalSummary> => {
  const response = await axios.get(`${API_URL}/accounting/fiscal-config/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const validateFiscalConfig = async (token: string): Promise<{
  isComplete: boolean;
  missingFields: string[];
}> => {
  const response = await axios.get(`${API_URL}/accounting/fiscal-config/validate`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getNextInvoiceNumber = async (token: string): Promise<{ invoiceNumber: string }> => {
  const response = await axios.post(`${API_URL}/accounting/fiscal-config/next-invoice-number`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ========================================
// ASIENTOS CONTABLES
// ========================================

export const getJournalEntries = async (token: string, filters?: {
  startDate?: string;
  endDate?: string;
  entryType?: string;
}): Promise<JournalEntry[]> => {
  const response = await axios.get(`${API_URL}/accounting/journal-entries`, {
    params: filters,
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getJournalEntry = async (token: string, id: string): Promise<JournalEntry> => {
  const response = await axios.get(`${API_URL}/accounting/journal-entries/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ========================================
// CÁLCULOS FISCALES
// ========================================

export const getIVABalance = async (token: string, startDate: string, endDate: string): Promise<{
  ivaGenerado: number;
  ivaDescontable: number;
  saldo: number;
  tipo: 'a_pagar' | 'a_favor';
}> => {
  const response = await axios.get(`${API_URL}/accounting/tax/iva-balance`, {
    params: { startDate, endDate },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getWithholdingsInFavor = async (token: string, year: number): Promise<{
  total: number;
  byType: {
    reteFuente: number;
    reteIVA: number;
    reteICA: number;
  };
  count: number;
}> => {
  const response = await axios.get(`${API_URL}/accounting/tax/withholdings-in-favor`, {
    params: { year },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getTaxProvision = async (token: string, month?: number, year?: number): Promise<{
  total: number;
  breakdown: {
    iva: number;
    withholdings: number;
  };
}> => {
  const params = new URLSearchParams();
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());

  const response = await axios.get(`${API_URL}/accounting/tax/provision?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ========================================
// OCR DE FACTURAS (Futuro)
// ========================================

export const scanInvoice = async (token: string, imageFile: File): Promise<{
  supplierName?: string;
  supplierNit?: string;
  invoiceNumber?: string;
  date?: string;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  confidence?: number;
}> => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await axios.post(`${API_URL}/accounting/expenses/ocr-scan`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    }
  });

  return response.data;
};

export default {
  // Dashboard
  getDashboard,
  getIVAReport,
  getProfitAndLoss,
  getBalanceSheet,
  getExpensesByCategory,

  // Exportación Excel
  exportIVAReportToExcel,
  exportProfitAndLossToExcel,
  exportBalanceSheetToExcel,
  downloadBlob,

  // Gastos
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  markExpenseAsPaid,
  cancelExpense,
  getExpenseStats,

  // Configuración Fiscal
  getFiscalConfig,
  saveFiscalConfig,
  getFiscalSummary,
  validateFiscalConfig,
  getNextInvoiceNumber,

  // Asientos Contables
  getJournalEntries,
  getJournalEntry,

  // Cálculos Fiscales
  getIVABalance,
  getWithholdingsInFavor,
  getTaxProvision,

  // OCR
  scanInvoice
};
