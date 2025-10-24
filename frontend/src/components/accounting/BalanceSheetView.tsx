import React, { useState, useEffect } from 'react';
import { Download, Calendar, Loader2, TrendingUp } from 'lucide-react';
import { useAccountingStore } from '@/stores/accountingStore';
import { exportBalanceSheetToExcel, downloadBlob } from '@/services/accountingService';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Vista de Balance General
 *
 * Muestra la ecuación contable fundamental:
 * ACTIVOS = PASIVOS + PATRIMONIO
 *
 * Reporte financiero que muestra la situación económica
 * del negocio en un momento específico
 */

export const BalanceSheetView: React.FC = () => {
  const { balanceSheet, reportsLoading, loadBalanceSheet } = useAccountingStore();
  const { toast } = useToast();

  const [exportLoading, setExportLoading] = useState(false);

  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    // Cargar balance del día actual al montar
    loadBalanceSheet(date);
  }, []);

  const handleGenerateReport = () => {
    loadBalanceSheet(date);
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);

      // Llamar al servicio de exportación
      const blob = await exportBalanceSheetToExcel(date);

      // Generar nombre de archivo con la fecha
      const filename = `balance-general-${date}.xlsx`;

      // Descargar el archivo
      downloadBlob(blob, filename);

      toast({
        title: 'Reporte Descargado',
        description: 'El Balance General se ha descargado exitosamente en formato Excel',
      });
    } catch (error) {
      console.error('Error al exportar Balance General:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el reporte. Intenta nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Calcular si el balance cuadra
  const isBalanced = balanceSheet
    ? Math.abs(balanceSheet.assets.total - (balanceSheet.liabilities.total + balanceSheet.equity.total)) < 1
    : true;

  return (
    <div className="space-y-6">
      {/* Filtro de Fecha */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Fecha del Balance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <Label htmlFor="date" className="mb-2 block">
              Fecha
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
            />
          </div>
          <Button
            onClick={handleGenerateReport}
            disabled={reportsLoading}
            variant="primary"
            className="transition-all hover:shadow-nexo-glow-primary gap-2"
          >
            {reportsLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Generar Balance
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Reporte */}
      {balanceSheet && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Balance General
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Al {new Date(balanceSheet.date).toLocaleDateString('es-CO')}
                </p>
              </div>
              <Button
                onClick={handleExport}
                disabled={exportLoading}
                variant="outline"
                className="gap-2"
              >
                {exportLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Descargando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Exportar a Excel
                  </>
                )}
              </Button>
            </div>

            {/* Ecuación Contable */}
            <div className={`rounded-lg p-4 ${
              isBalanced
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-destructive-50 dark:bg-destructive-900/20 border-destructive-200 dark:border-destructive-800'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className={`w-5 h-5 ${
                  isBalanced ? 'text-green-600 dark:text-green-400' : 'text-destructive-600 dark:text-destructive-400'
                }`} />
                <p className={`font-semibold ${
                  isBalanced ? 'text-green-700 dark:text-green-300' : 'text-destructive-700 dark:text-destructive-300'
                }`}>
                  {isBalanced ? '✅ Balance Cuadrado' : '⚠️ Balance Descuadrado'}
                </p>
              </div>
              <p className="text-center text-sm mt-2 text-gray-600 dark:text-gray-400">
                Activos = Pasivos + Patrimonio
              </p>
            </div>
          </div>

          {/* ACTIVOS */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Activos
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 dark:text-gray-300">Caja</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${balanceSheet.assets.current.cash.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 dark:text-gray-300">Bancos</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${balanceSheet.assets.current.bank.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 dark:text-gray-300">Cuentas por Cobrar</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${balanceSheet.assets.current.accounts_receivable.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 dark:text-gray-300">Inventarios</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${balanceSheet.assets.current.inventory.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="border-t dark:border-gray-700 pt-3 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Activos
                </span>
                <span className="text-2xl font-bold text-info-600 dark:text-info-400">
                  ${balanceSheet.assets.total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* PASIVOS */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Pasivos
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 dark:text-gray-300">Cuentas por Pagar</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${balanceSheet.liabilities.current.accounts_payable.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 dark:text-gray-300">Impuestos por Pagar</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${balanceSheet.liabilities.current.taxes_payable.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="border-t dark:border-gray-700 pt-3 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Pasivos
                </span>
                <span className="text-2xl font-bold text-destructive-600 dark:text-destructive-400">
                  ${balanceSheet.liabilities.total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* PATRIMONIO */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Patrimonio
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 dark:text-gray-300">Capital</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${balanceSheet.equity.capital.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 dark:text-gray-300">Utilidades Retenidas</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${balanceSheet.equity.retained_earnings.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 dark:text-gray-300">Utilidad del Ejercicio</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${balanceSheet.equity.current_profit.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="border-t dark:border-gray-700 pt-3 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Patrimonio
                </span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${balanceSheet.equity.total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Interpretación */}
          <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-4">
            <h4 className="font-semibold text-info-800 dark:text-info-200 mb-2">
              💡 ¿Qué significa esto?
            </h4>
            <p className="text-sm text-info-700 dark:text-info-300">
              El Balance General muestra lo que tu negocio TIENE (activos), lo que DEBE (pasivos) y
              lo que realmente TE PERTENECE (patrimonio). Es como una foto de la salud financiera
              de tu negocio en este momento específico.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!balanceSheet && !reportsLoading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Selecciona una fecha y genera el Balance General
          </p>
        </div>
      )}
    </div>
  );
};
