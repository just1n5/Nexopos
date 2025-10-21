import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown
} from 'lucide-react';
import { useAccountingStore } from '@/stores/accountingStore';
import { useAuthStore } from '@/stores/authStore';
import { Expense, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Componente de Lista de Gastos
 *
 * Muestra todos los gastos registrados con:
 * - Filtros por fecha, categoría, estado
 * - Búsqueda por proveedor o descripción
 * - Acciones: marcar como pagado, editar, eliminar
 * - Exportación a Excel/CSV
 */

interface ExpenseListProps {
  onEditExpense?: (expense: Expense) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ onEditExpense }) => {
  const { token } = useAuthStore();
  const { expenses, expensesLoading, loadExpenses, markExpenseAsPaid, cancelExpense } = useAccountingStore();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Load expenses on mount
  useEffect(() => {
    if (token) {
      loadExpenses(token);
    }
  }, [loadExpenses, token]);

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      expense.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = selectedStatus === 'all' || expense.status.toString() === selectedStatus.toUpperCase();

    // Category filter
    const matchesCategory = selectedCategory === 'all' || expense.type.toString() === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleMarkAsPaid = async (expenseId: string) => {
    if (confirm('¿Marcar este gasto como pagado?')) {
      if (!token) return;
      try {
        await markExpenseAsPaid(token, expenseId);
      } catch (error) {
        console.error('Error marking expense as paid:', error);
      }
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (confirm('¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.')) {
      if (!token) return;
      try {
        await cancelExpense(token, expenseId);
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const getStatusBadge = (status: any) => {
    const statusStr = status.toString().toLowerCase();
    switch (statusStr) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Pagado
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pendiente
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryInfo = (type: string) => {
    return EXPENSE_CATEGORIES.find(cat => cat.type === type);
  };

  const getPaymentMethodInfo = (method: any) => {
    return PAYMENT_METHODS.find(pm => pm.method.toString() === method.toString());
  };

  const calculateTotal = () => {
    return filteredExpenses
      .filter(e => e.status.toString().toLowerCase() !== 'cancelled')
      .reduce((sum, expense) => sum + expense.total, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por proveedor, factura, descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                <option value="paid">Pagado</option>
                <option value="pending">Pendiente</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todas</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.type} value={cat.type}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range (Future Feature) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rango de Fechas
              </label>
              <Input type="date" disabled className="opacity-50" />
              <p className="text-xs text-gray-500 mt-1">Próximamente</p>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(selectedStatus !== 'all' || selectedCategory !== 'all' || searchQuery !== '') && (
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Filtros activos:</span>
                {searchQuery && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    Búsqueda: "{searchQuery}"
                  </span>
                )}
                {selectedStatus !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    Estado: {selectedStatus}
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    Categoría: {getCategoryInfo(selectedCategory)?.label}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('all');
                    setSelectedCategory('all');
                  }}
                  className="ml-auto text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Mostrando {filteredExpenses.length} de {expenses.length} gastos
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-600 dark:text-blue-400">Total filtrado</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              ${calculateTotal().toLocaleString('es-CO', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Expense List */}
      {expensesLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando gastos...</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {expenses.length === 0 ? 'No hay gastos registrados' : 'No se encontraron gastos con los filtros aplicados'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => {
            const categoryInfo = getCategoryInfo(expense.type);
            const paymentInfo = getPaymentMethodInfo(expense.paymentMethod);

            return (
              <div
                key={expense.id}
                className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-4xl flex-shrink-0">
                    {categoryInfo?.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {expense.supplierName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {categoryInfo?.label}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${expense.total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                        </p>
                        {getStatusBadge(expense.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Fecha:</span>
                        <span className="ml-1 text-gray-900 dark:text-white">
                          {new Date(expense.expenseDate).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      {expense.invoiceNumber && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Factura:</span>
                          <span className="ml-1 text-gray-900 dark:text-white">
                            {expense.invoiceNumber}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Pago:</span>
                        <span className="ml-1 text-gray-900 dark:text-white">
                          {paymentInfo?.icon} {paymentInfo?.label}
                        </span>
                      </div>
                      {expense.paymentDate && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Pagado:</span>
                          <span className="ml-1 text-gray-900 dark:text-white">
                            {new Date(expense.paymentDate).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                      )}
                    </div>

                    {expense.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {expense.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {expense.status.toString().toLowerCase() === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPaid(expense.id)}
                          className="gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar como Pagado
                        </Button>
                      )}
                      {expense.status.toString().toLowerCase() !== 'cancelled' && onEditExpense && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditExpense(expense)}
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </Button>
                      )}
                      {expense.status.toString().toLowerCase() !== 'cancelled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          className="gap-2 text-red-600 hover:text-red-700 hover:border-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
