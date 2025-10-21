import React, { useState } from 'react';
import { X, Camera, Upload, Save, AlertCircle } from 'lucide-react';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, ExpenseType, PaymentMethod, CreateExpenseDto } from '@/types/accounting';
import { useAccountingStore } from '@/stores/accountingStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

/**
 * Componente de Registro de Gastos
 *
 * Implementa el concepto de "30 segundos para registrar un gasto"
 * - Categorías con íconos grandes
 * - Campos mínimos requeridos
 * - Captura de foto de factura (futuro OCR)
 * - Sin jerga contable visible
 */

interface ExpenseRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ExpenseRegistration: React.FC<ExpenseRegistrationProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuthStore();
  const { createExpense } = useAccountingStore();

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<ExpenseType | null>(null);
  const [amount, setAmount] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación
    if (!selectedCategory) {
      setError('Selecciona una categoría');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    if (!supplierName.trim()) {
      setError('Ingresa el nombre del proveedor');
      return;
    }

    setLoading(true);

    try {
      const amountValue = parseFloat(amount);
      const expenseData: CreateExpenseDto = {
        type: selectedCategory,
        expenseDate: new Date().toISOString().split('T')[0],
        supplierName: supplierName.trim(),
        invoiceNumber: invoiceNumber.trim() || undefined,
        description: description.trim() || undefined,
        subtotal: amountValue,
        taxAmount: 0,
        total: amountValue,
        paymentMethod,
        paymentDate: new Date().toISOString().split('T')[0],
        // TODO: Agregar soporte para invoiceImageUrl cuando implementemos el upload
      };

      await createExpense(token!, expenseData);

      // Reset form
      setSelectedCategory(null);
      setAmount('');
      setSupplierName('');
      setInvoiceNumber('');
      setDescription('');
      setPaymentMethod(PaymentMethod.CASH);
      setPhotoPreview(null);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el gasto');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryData = EXPENSE_CATEGORIES.find(cat => cat.type === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Registrar Gasto
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Step 1: Seleccionar Categoría */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">
              1. ¿Qué tipo de gasto es?
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {EXPENSE_CATEGORIES.map((category) => (
                <button
                  key={category.type}
                  type="button"
                  onClick={() => setSelectedCategory(category.type)}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-center
                    ${selectedCategory === category.type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }
                  `}
                >
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.label}
                  </div>
                </button>
              ))}
            </div>
            {selectedCategoryData && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {selectedCategoryData.description}
              </p>
            )}
          </div>

          {/* Step 2: Datos del Gasto */}
          {selectedCategory && (
            <div className="space-y-4 border-t dark:border-gray-700 pt-6">
              <Label className="text-lg font-semibold block">
                2. Datos del Gasto
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monto */}
                <div>
                  <Label htmlFor="amount" className="mb-2 block">
                    Monto Total *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      $
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-8"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Proveedor */}
                <div>
                  <Label htmlFor="supplier" className="mb-2 block">
                    Proveedor *
                  </Label>
                  <Input
                    id="supplier"
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Nombre del proveedor"
                    required
                  />
                </div>

                {/* Número de Factura */}
                <div>
                  <Label htmlFor="invoiceNumber" className="mb-2 block">
                    Número de Factura
                  </Label>
                  <Input
                    id="invoiceNumber"
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>

                {/* Método de Pago */}
                <div>
                  <Label htmlFor="paymentMethod" className="mb-2 block">
                    Método de Pago *
                  </Label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.method} value={method.method}>
                        {method.icon} {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <Label htmlFor="description" className="mb-2 block">
                  Descripción / Notas
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles adicionales del gasto (opcional)"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Foto de Factura (Opcional) */}
          {selectedCategory && (
            <div className="space-y-4 border-t dark:border-gray-700 pt-6">
              <Label className="text-lg font-semibold block">
                3. Foto de Factura (Opcional)
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Toma una foto de la factura para tener respaldo
              </p>

              <div className="flex gap-4">
                {/* Upload Button */}
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Subir imagen
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {/* Camera Button (Future Feature) */}
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-center">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tomar foto
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      (Próximamente)
                    </p>
                  </div>
                </label>
              </div>

              {/* Photo Preview */}
              {photoPreview && (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-4 justify-end border-t dark:border-gray-700 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedCategory}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Registrar Gasto
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
