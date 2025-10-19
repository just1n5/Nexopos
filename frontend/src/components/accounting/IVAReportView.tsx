import React, { useState } from 'react';
import { Download, Calendar, Loader2 } from 'lucide-react';
import { useAccountingStore } from '@/stores/accountingStore';
import { exportIVAReportToExcel, downloadBlob } from '@/services/accountingService';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Vista de Reporte de IVA
 *
 * Genera el reporte de IVA para declaración ante la DIAN
 * Incluye:
 * - IVA generado (de ventas)
 * - IVA descontable (de compras)
 * - Saldo a pagar o a favor
 */

export const IVAReportView: React.FC = () => {
  const { ivaReport, reportsLoading, loadIVAReport } = useAccountingStore();
  const { toast } = useToast();

  const [exportLoading, setExportLoading] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primer día del mes
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });

  const handleGenerateReport = () => {
    loadIVAReport(startDate, endDate);
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);

      // Llamar al servicio de exportación
      const blob = await exportIVAReportToExcel(startDate, endDate);

      // Generar nombre de archivo con las fechas
      const filename = `reporte-iva-${startDate}-${endDate}.xlsx`;

      // Descargar el archivo
      downloadBlob(blob, filename);

      toast({
        title: 'Reporte Descargado',
        description: 'El reporte de IVA se ha descargado exitosamente en formato Excel',
      });
    } catch (error) {
      console.error('Error al exportar reporte IVA:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el reporte. Intenta nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setExportLoading(false);
    }
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
      {ivaReport && (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Reporte de IVA
              </h3>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* IVA Generado */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400 mb-1">
                  IVA Generado (Ventas)
                </p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  ${ivaReport.summary.ivaGenerado.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </p>
              </div>

              {/* IVA Descontable */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                  IVA Descontable (Compras)
                </p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  ${ivaReport.summary.ivaDescontable.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </p>
              </div>

              {/* Saldo */}
              <div className={`rounded-lg p-4 border ${
                ivaReport.summary.tipo === 'a_pagar'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
              }`}>
                <p className={`text-sm mb-1 ${
                  ivaReport.summary.tipo === 'a_pagar'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-purple-600 dark:text-purple-400'
                }`}>
                  {ivaReport.summary.tipo === 'a_pagar' ? 'IVA a Pagar' : 'IVA a Favor'}
                </p>
                <p className={`text-3xl font-bold ${
                  ivaReport.summary.tipo === 'a_pagar'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-purple-700 dark:text-purple-300'
                }`}>
                  ${ivaReport.summary.saldo.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Información del Período
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Período</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(ivaReport.period.startDate).toLocaleDateString('es-CO')} - {' '}
                    {new Date(ivaReport.period.endDate).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Ventas</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${ivaReport.sales.totalSales.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Base Gravable Ventas</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${ivaReport.sales.baseGravable.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Ventas Exentas</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${ivaReport.sales.salesExcludedFromIva.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desglose por Tarifa */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Desglose de IVA Generado por Tarifa
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Tarifa
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Base Gravable
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      IVA
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {ivaReport.sales.byTaxRate.map((rate, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {rate.rate}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                        ${rate.baseGravable.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                        ${rate.ivaAmount.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-900 font-semibold">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                      ${ivaReport.sales.baseGravable.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                      ${ivaReport.summary.ivaGenerado.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* IVA Descontable */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              IVA Descontable de Compras
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Compras</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${ivaReport.purchases.totalPurchases.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Base Gravable</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${ivaReport.purchases.baseGravable.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">IVA Descontable</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${ivaReport.summary.ivaDescontable.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Notas Importantes */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              📋 Notas para la Declaración DIAN
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
              <li>Este reporte debe ser verificado por un contador antes de la declaración</li>
              <li>Asegúrate de tener todos los soportes de las compras con IVA descontable</li>
              <li>Los períodos de declaración de IVA son bimestrales para responsables de IVA</li>
              <li>Conserva este reporte junto con los documentos soporte por 5 años</li>
            </ul>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!ivaReport && !reportsLoading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Selecciona un período y genera el reporte de IVA
          </p>
        </div>
      )}
    </div>
  );
};
