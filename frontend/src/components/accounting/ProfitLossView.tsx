import React, { useState } from 'react';
import { Download, Calendar, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useAccountingStore } from '@/stores/accountingStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Vista de Estado de Resultados (Profit & Loss)
 *
 * Muestra en lenguaje simple:
 * - Ingresos totales
 * - Gastos por categoría
 * - Utilidad o pérdida del período
 *
 * Sin jerga contable, enfocado en que el comerciante entienda
 * si está ganando o perdiendo dinero
 */

export const ProfitLossView: React.FC = () => {
  const { profitAndLoss, reportsLoading, loadProfitAndLoss } = useAccountingStore();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });

  const handleGenerateReport = () => {
    loadProfitAndLoss(startDate, endDate);
  };

  const handleExport = () => {
    alert('Función de exportación próximamente disponible');
  };

  return (
    <div className="space-y-6">
      {/* Filtros de Fecha */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Período del Reporte
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="startDate" className="mb-2 block">
              Fecha Inicio
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endDate" className="mb-2 block">
              Fecha Fin
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button
            onClick={handleGenerateReport}
            disabled={reportsLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
          >
            {reportsLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Generar Reporte
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Reporte */}
      {profitAndLoss && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Estado de Resultados
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {new Date(profitAndLoss.period.startDate).toLocaleDateString('es-CO')} - {' '}
                  {new Date(profitAndLoss.period.endDate).toLocaleDateString('es-CO')}
                </p>
              </div>
              <Button onClick={handleExport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>

            {/* Resultado Final Destacado */}
            <div className={`rounded-lg p-6 ${
              profitAndLoss.netProfit >= 0
                ? 'bg-gradient-to-br from-green-500 to-green-600'
                : 'bg-gradient-to-br from-red-500 to-red-600'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-lg mb-1">
                    {profitAndLoss.netProfit >= 0 ? 'Ganancia del Período' : 'Pérdida del Período'}
                  </p>
                  <p className="text-white text-4xl font-bold">
                    ${Math.abs(profitAndLoss.netProfit).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                {profitAndLoss.netProfit >= 0 ? (
                  <TrendingUp className="w-16 h-16 text-white/40" />
                ) : (
                  <TrendingDown className="w-16 h-16 text-white/40" />
                )}
              </div>
              <p className="text-white/80 text-sm mt-4">
                {profitAndLoss.netProfit >= 0
                  ? '¡Excelente! Tu negocio está generando ganancias'
                  : 'Los gastos están superando los ingresos este período'}
              </p>
            </div>
          </div>

          {/* Ingresos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Ingresos
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 dark:text-gray-300">Ventas Totales</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${profitAndLoss.revenue.sales.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>

              {profitAndLoss.revenue.otherIncome > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700 dark:text-gray-300">Otros Ingresos</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${profitAndLoss.revenue.otherIncome.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              )}

              <div className="border-t dark:border-gray-700 pt-3 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Ingresos
                </span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${profitAndLoss.revenue.total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Costos y Gastos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Costos y Gastos
            </h4>

            <div className="space-y-3">
              {/* Costo de Ventas */}
              <div className="flex justify-between items-center py-2">
                <div>
                  <span className="text-gray-700 dark:text-gray-300">Costo de Mercancía Vendida</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Lo que te costó la mercancía que vendiste
                  </p>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${profitAndLoss.expenses.costOfSales.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>

              {/* Utilidad Bruta */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex justify-between items-center">
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Utilidad Bruta (Ventas - Costo)
                </span>
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  ${profitAndLoss.grossProfit.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="border-t dark:border-gray-700 pt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gastos Operativos:
                </p>

                {profitAndLoss.expenses.byCategory.map((category, index) => (
                  <div key={index} className="flex justify-between items-center py-1 pl-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {category.categoryName}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${category.amount.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}

                <div className="border-t dark:border-gray-700 pt-2 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Gastos Operativos
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${profitAndLoss.expenses.operatingExpenses.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-3 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Costos y Gastos
                </span>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ${profitAndLoss.expenses.total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Resumen Visual */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resumen Visual
            </h4>

            <div className="space-y-4">
              {/* Barra de Ingresos */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Ingresos</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${profitAndLoss.revenue.total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Barra de Gastos */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Gastos</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${profitAndLoss.expenses.total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-red-500 h-4 rounded-full"
                    style={{
                      width: `${Math.min((profitAndLoss.expenses.total / profitAndLoss.revenue.total) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Métricas Clave */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t dark:border-gray-700">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Margen Bruto</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {((profitAndLoss.grossProfit / profitAndLoss.revenue.total) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Margen Neto</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {((profitAndLoss.netProfit / profitAndLoss.revenue.total) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gastos / Ingresos</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {((profitAndLoss.expenses.total / profitAndLoss.revenue.total) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interpretación */}
          <div className={`rounded-lg p-4 border ${
            profitAndLoss.netProfit >= 0
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              profitAndLoss.netProfit >= 0
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              💡 Qué significa esto
            </h4>
            <p className={`text-sm ${
              profitAndLoss.netProfit >= 0
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {profitAndLoss.netProfit >= 0 ? (
                <>
                  Tu negocio está generando ganancias. Por cada $100 que vendes, te quedan ${' '}
                  ${((profitAndLoss.netProfit / profitAndLoss.revenue.total) * 100).toFixed(0)} de utilidad neta.
                  {profitAndLoss.netProfit / profitAndLoss.revenue.total < 0.1 && (
                    <> Sin embargo, tu margen es bajo. Considera revisar tus gastos o aumentar precios.</>
                  )}
                </>
              ) : (
                <>
                  Tus gastos están superando los ingresos. Necesitas reducir gastos o aumentar ventas.
                  Revisa el detalle de gastos para identificar dónde puedes optimizar.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!profitAndLoss && !reportsLoading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Selecciona un período y genera el estado de resultados
          </p>
        </div>
      )}
    </div>
  );
};
